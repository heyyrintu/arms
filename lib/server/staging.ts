import 'server-only';
import {Pool} from 'pg';
import {stageConfig,stageRoleUrl,stageRoles,stageActorId,stageNotice,stageEmail} from '@/lib/staging/config.mjs';
import {stageFileStore} from '@/lib/staging/file-store.mjs';
import {intakeSubmissionService} from '@/lib/intake/service.mjs';
import {documentProcessor} from '@/lib/intake/documents.mjs';
import {scanCurrentPdf} from '@/lib/intake/scanner-health.mjs';
import {internalNotifications} from '@/lib/intake/notifications.mjs';
import {getIntakeReview,authorizeIntake} from './intake';
import {syntheticCase} from '@/lib/staging/fixtures.mjs';
import {randomUUID} from 'node:crypto';
const pools=new Map<string,Pool>();
export async function stagePool(role:string) {
 stageConfig(process.env);
 let pool=pools.get(role);if(!pool){pool=new Pool({connectionString:stageRoleUrl(role),max:2,connectionTimeoutMillis:5000,statement_timeout:5000,idleTimeoutMillis:10000});pool.on('error',()=>{});pools.set(role,pool);}
 const {rows:[marker]}=await pool.query("SELECT current_database() AS name,(SELECT value FROM arms_stage.marker) AS marker");
 if(marker.name!=='arms_private_stage'||marker.marker!=='synthetic-only-v1')throw new Error('STAGING_UNAVAILABLE');return pool;
}
export async function captureStageCode(db:Pool,email:string,code:string) {
 stageConfig(process.env);if(email!==stageEmail||!/^\d{6}$/.test(code))throw new Error('STAGING_RECIPIENT_REFUSED');
 await db.query("INSERT INTO arms_stage.messages(kind,recipient,body) VALUES('staff-code',$1,$2)",[email,'Synthetic staff sign-in code: '+code]);
}
export function privateStageStorage(){stageConfig(process.env);return stageFileStore('/data/stage-files');}
export async function runStageCase(input:Record<string,unknown>) {
 const actor=await authorizeIntake();if(actor?.id!==stageActorId||actor.role!=='admin')throw new Error('FORBIDDEN');
 const {kind,values}=syntheticCase(input);
 const db=await stagePool(stageRoles.submit);
 const service=intakeSubmissionService({db,secret:Buffer.from(stageConfig(process.env).secret),enabled:true,policy:{status:'approved',version:stageNotice},verifyAbuse:async()=>true});
 const receipt=await service.submit(kind,values,{clientIp:'127.0.0.1'});
 let documentStatus='none';
 if(kind!=='employer'&&input.cv==='clean') {
  const processor=documentProcessor({db:await stagePool(stageRoles.processor),storage:privateStageStorage(),scan:(bytes:Buffer)=>scanCurrentPdf(bytes,{socketPath:'/run/clamav/clamd.sock'}),authorizeParent:async(id:string)=>(await getIntakeReview()).get(id)});
  try {documentStatus=(await processor.stage(receipt.referenceId,{name:'synthetic.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-1.7\nSynthetic private QA resume. No real personal data.\n%%EOF\n')})).status;}
  catch(error){if(error instanceof Error&&error.message==='DOCUMENT_EXISTS')documentStatus='already_attached';else throw error;}
 }
 const capture=await stagePool(stageRoles.capture);
 const worker=internalNotifications({db:await stagePool(stageRoles.notifier),enabled:true,send:async(item:{referenceId:string;kind:string})=>{
  await capture.query("INSERT INTO arms_stage.messages(kind,recipient,body,record_id) VALUES('staff-notification','qa@example.invalid',$1,$2) ON CONFLICT DO NOTHING",['Synthetic '+item.kind+' received. Reference '+item.referenceId,item.referenceId]);
 }});
 // Capture only private test mail; no SES/API credentials exist in this stack.
 const notification=await worker.deliverOne();
 await capture.query("INSERT INTO arms_stage.messages(kind,recipient,body,record_id) VALUES('acknowledgement','synthetic@example.invalid',$1,$2) ON CONFLICT DO NOTHING",['Synthetic receipt '+receipt.referenceId+'. Saved, not a promise of placement.',receipt.referenceId]);
 return {referenceId:receipt.referenceId,stored:true,documentStatus,notification:notification.state,mailTransport:'private-capture-only',requestId:input.requestId??randomUUID()};
}
