import nextEnv from '@next/env';
import {Client} from 'pg';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {databaseConfig} from './lib/database-config.mjs';
import {intakeSubmissionService,intakeReviewService} from '../lib/intake/service.mjs';
import {documentProcessor,documentReview} from '../lib/intake/documents.mjs';
import {internalNotifications} from '../lib/intake/notifications.mjs';
import {jobsService} from '../lib/jobs-service.mjs';
import {emptyJobPosting} from '../lib/job-posting.mjs';
import {reviewPermissionQuery,assertReviewPermissions} from '../lib/intake/review-permissions.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const entries=[['INTAKE_SUBMIT_DATABASE_URL','arms_intake_submitter'],['INTAKE_REVIEW_DATABASE_URL','arms_intake_reviewer'],['CV_PROCESSOR_DATABASE_URL','arms_cv_processor'],['INTAKE_NOTIFIER_DATABASE_URL','arms_intake_notifier']];
const clients=[];let owner,outer=false;
async function connect(url){const db=new Client(databaseConfig(url));await db.connect();clients.push(db);return db;}
async function counts(db){return (await db.query(`SELECT (SELECT count(*)::int FROM arms_intake.records) AS records,(SELECT count(*)::int FROM arms_intake.documents) AS documents,(SELECT count(*)::int FROM arms_intake.activity) AS activity,(SELECT count(*)::int FROM arms_intake.document_access) AS downloads,(SELECT count(*)::int FROM arms_intake.outbox) AS outbox,(SELECT count(*)::int FROM arms_jobs.jobs) AS jobs,(SELECT count(*)::int FROM arms_jobs.activity) AS job_activity`)).rows[0];}
try {
 const roles=[];
 for(const [key,name] of entries){const client=await connect(process.env[key]);const {rows:[role]}=await client.query(`SELECT current_user AS name,EXISTS(SELECT 1 FROM pg_roles r WHERE pg_has_role(r.oid,'MEMBER') AND (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb)) AS elevated`);assert.equal(role.name,name);assert.equal(role.elevated,false);roles.push(name);}
 assertReviewPermissions((await clients[1].query(reviewPermissionQuery)).rows[0]);
 for(const client of clients) {
  await assert.rejects(()=>client.query('SELECT password_hash FROM arms_auth.staff_users'),error=>error.code==='42501');
  await assert.rejects(()=>client.query('DELETE FROM arms_intake.activity WHERE false'),error=>error.code==='42501');
 }
 await assert.rejects(()=>clients[0].query('SELECT payload FROM arms_intake.records'),error=>error.code==='42501');
 await assert.rejects(()=>clients[2].query('SELECT payload FROM arms_intake.records'),error=>error.code==='42501');
 await assert.rejects(()=>clients[3].query('SELECT payload FROM arms_intake.records'),error=>error.code==='42501');
 const url=new URL(process.env.DATABASE_URL);if(process.argv.includes('--ssh-tunnel')){url.hostname='127.0.0.1';url.port='15499';for(const key of [...url.searchParams.keys()])if(key.startsWith('ssl'))url.searchParams.delete(key);url.searchParams.set('sslmode','disable');}
 owner=await connect(url.toString());
 for(const name of ['008_intake.sql','009_intake_grants.sql','010_private_documents.sql','011_internal_notifications.sql']){const source=await readFile(new URL('../database/'+name,import.meta.url));const {rows:[row]}=await owner.query('SELECT sha256 FROM arms_intake.schema_migrations WHERE name=$1',[name]);assert.equal(row.sha256,createHash('sha256').update(source).digest('hex'));}
 const before=await counts(owner);
 if(!process.argv.includes('--rollback-workflow')){console.log(JSON.stringify({connected:true,restrictedRoles:roles.length,migrationHashesVerified:4,counts:before,readOnly:true}));}
 else {
  await owner.query('BEGIN');outer=true;
  const {rows:[actor]}=await owner.query("SELECT id,role FROM arms_auth.staff_users WHERE active AND role='admin' ORDER BY created_at LIMIT 1");if(!actor)throw new Error('ADMIN_REQUIRED');
  // Nested service transactions are savepoints inside this owner-controlled test.
  // No service COMMIT can commit the outer synthetic workflow.
  const query=(sql,args)=>owner.query(sql==='BEGIN'?'SAVEPOINT arms_probe_nested':sql==='COMMIT'?'RELEASE SAVEPOINT arms_probe_nested':sql==='ROLLBACK'?'ROLLBACK TO SAVEPOINT arms_probe_nested':sql,args);
  const db={query,connect:async()=>({query,release(){}})},authorize=async()=>actor;
  const as=async(name,run)=>{await owner.query('SET LOCAL ROLE '+name);return run();};
  const jobs=jobsService({db,authorize});
  let job=await as('arms_jobs_runtime',()=>jobs.mutate(randomUUID(),{operation:'save',revision:0,posting:{...emptyJobPosting(),title:'PRIVATE ROLLBACK FIXTURE - not a vacancy',slug:'private-check-'+randomUUID(),industrySlug:'gig-work',location:'Synthetic private location',employmentType:'Contract',payrollModel:'client',description:'Synthetic private integration fixture. Never committed or visible publicly.',responsibilities:'Synthetic task only',requirements:'Synthetic requirement only',expiresOn:'2090-12-01'}}));
  job=await as('arms_jobs_runtime',()=>jobs.mutate(job.id,{operation:'publish',revision:job.revision,previewedRevision:job.revision,confirmedGenuine:true,approvalReference:'Operator rollback fixture; no real vacancy authorization or public publication'}));
  const publicReader=await connect(process.env.JOBS_PUBLIC_DATABASE_URL);assert.equal((await publicReader.query('SELECT id FROM arms_jobs.public_jobs WHERE id=$1',[job.id])).rows.length,0);
  const submit=intakeSubmissionService({db,enabled:true,secret:randomBytes(32),policy:{status:'approved',version:'PRIVATE-SYNTHETIC-ROLLBACK-ONLY'},verifyAbuse:async()=>true});
  const base=()=>({requestId:randomUUID(),name:'Synthetic private fixture',email:'synthetic@example.invalid',phone:'+919000000000',location:'Synthetic private location',consent:true,noticeVersion:'PRIVATE-SYNTHETIC-ROLLBACK-ONLY'});
  const employer={...base(),company:'Synthetic private fixture',industry:'warehousing-fulfillment',headcount:'2',payrollModel:'undecided',requirements:'Synthetic private fixture only'};
  const talent={...base(),industry:'cafes-hospitality',preferredRole:'Synthetic private fixture',experience:'Synthetic private fixture only'};
  const application={...base(),jobId:job.id,experience:'Synthetic private fixture only',talentNetworkOptIn:false};
  const receipts=[];
  for(const [kind,input] of [['employer',employer],['talent',talent],['application',application]])receipts.push(await as('arms_intake_submitter',()=>submit.submit(kind,input,{clientIp:'192.0.2.1'})));
  assert.deepEqual(await as('arms_intake_submitter',()=>submit.submit('employer',employer,{clientIp:'192.0.2.1'})),receipts[0]);
  for(const receipt of receipts)assert.equal((await clients[1].query('SELECT id FROM arms_intake.records WHERE id=$1',[receipt.referenceId])).rows.length,0);
  const review=intakeReviewService({db,authorize}),files=new Map(),storage={put:async(key,bytes)=>files.set(key,bytes),get:async key=>files.get(key),remove:async key=>files.delete(key)};
  const parent=await as('arms_intake_reviewer',()=>review.get(receipts[1].referenceId));
  const processor=documentProcessor({db,storage,scan:async()=> 'clean',authorizeParent:async id=>id===parent.id?parent:null});
  const doc=await as('arms_cv_processor',()=>processor.stage(parent.id,{name:'synthetic.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-1.7\nPRIVATE SYNTHETIC ROLLBACK FIXTURE.\n%%EOF\n')}));assert.equal(doc.status,'clean');
  const documents=documentReview({db,storage,authorize,review});assert.ok((await as('arms_intake_reviewer',()=>documents.download(doc.documentId))).length);
  await as('arms_intake_reviewer',()=>review.changeStatus(parent.id,{status:'reviewing',revision:1}));
  await as('arms_intake_reviewer',()=>review.changeStatus(receipts[2].referenceId,{status:'withdrawn',revision:1}));
  const messages=[];const notify=internalNotifications({db,enabled:true,send:async value=>messages.push(value)});
  // The queue existed empty before this check; process only our uncommitted rows.
  if(before.outbox!==0)throw new Error('NONEMPTY_QUEUE');
  for(let i=0;i<3;i++)assert.equal((await as('arms_intake_notifier',()=>notify.deliverOne())).state,'sent');assert.equal(messages.length,3);
  await owner.query('ROLLBACK');outer=false;
  assert.deepEqual(await counts(owner),before);
  console.log(JSON.stringify({connected:true,restrictedRoles:roles.length,migrationHashesVerified:4,rollbackWorkflow:true,syntheticReceipts:3,retryDuplicatePrevented:true,privateFile:'memory fixture only',scanner:'stubbed; real engine pending',notifications:'stubbed; no SES send',independentReadersSawFixtures:false,countsAfterRollback:before,realApplicationsCreated:0,publicCollection:false,deployment:false}));
 }
} catch {if(outer)await owner?.query('ROLLBACK').catch(()=>{});console.error('Private intake verification failed; no workflow success claimed. Synthetic transaction was rolled back if open. No secrets displayed.');process.exitCode=1;}
finally{await Promise.all(clients.map(client=>client.end().catch(()=>{})));}
