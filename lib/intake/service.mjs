import {intakeTransitions as transitions} from './statuses.mjs';
import {createHmac,randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {intakePolicy,calendarMonths} from './policy.mjs';
import {parseIntake,isUuid,intakeKinds} from './validation.mjs';
export class IntakeError extends Error {
  constructor(code,fields={}) {super(code);this.fields=fields;}
}
const terminal=new Set(['hired','not_selected','withdrawn','closed']);
const safeColumns='id,kind,job_id,payload,notice_version,consent_at,future_roles_opt_in,status,revision,application_ended_at,application_delete_after,purpose_delete_after,created_at,updated_at';
async function transaction(db,run) {
 const client=await db.connect();
 try {await client.query('BEGIN');const result=await run(client);await client.query('COMMIT');return result;}
 catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error;}
 finally {client.release();}
}
// Deliberately not imported by any Next route. Defaults fail before reading input
// or opening a database; tests must explicitly inject an approved fixture policy.
/** @param {{db: any, secret: Buffer, enabled?: boolean, policy?: {status: string, version: string}, verifyAbuse: Function}} options */
export function intakeSubmissionService({db,secret,enabled=false,policy=intakePolicy,verifyAbuse}) {
 const hash=(purpose,value)=>createHmac('sha256',secret).update(purpose+'\0'+value).digest('hex');
 return {
  async submit(kind,input,context) {
   if(!enabled||policy.status!=='approved'||!Buffer.isBuffer(secret)||secret.length<32||typeof verifyAbuse!=='function') throw new IntakeError('UNAVAILABLE');
   if(!context||!isIP(context.clientIp)) throw new IntakeError('UNAVAILABLE');
   // clientIp must be supplied by a trusted request adapter, never posted JSON or
   // arbitrary X-Forwarded-For. Bot proof is adapter-owned and not persisted.
   if(!await verifyAbuse(context)) throw new IntakeError('ABUSE_REJECTED');
   const parsed=parseIntake(kind,input,policy.version);
   if(!parsed.values) throw new IntakeError('VALIDATION',parsed.errors);
   const {values,requestId}=parsed;
   const canonical=JSON.stringify({kind,noticeVersion:policy.version,values});
   const requestHash=hash('retry',requestId),payloadHash=hash('payload',canonical);
   // Limits commit independently so rejected/rolled-back work still consumes a
   // budget across instances. No raw address/contact/IP is retained in limits.
   for(const [scope,key,max] of [['global','all',100],['network',context.clientIp,10],['identity',values.phone,5]]) {
    const {rows:[limit]}=await db.query(`INSERT INTO arms_intake.limits(key_hash,window_started_at,attempts) VALUES($1,now(),1)
     ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN limits.window_started_at<now()-interval '1 hour' THEN 1 ELSE least(limits.attempts+1,1000000) END,
     window_started_at=CASE WHEN limits.window_started_at<now()-interval '1 hour' THEN now() ELSE limits.window_started_at END RETURNING attempts`,[hash(scope,key)]);
    if(limit.attempts>max) throw new IntakeError('RATE_LIMITED');
   }
   return transaction(db,async client=>{
    // Serializes retries across processes; uniqueness is also enforced in SQL.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[requestHash]);
    const {rows:[existing]}=await client.query('SELECT id,payload_hash FROM arms_intake.records WHERE request_hash=$1',[requestHash]);
    if(existing) {
     if(existing.payload_hash!==payloadHash) throw new IntakeError('CONFLICT');
     return {referenceId:existing.id,stored:true};
    }
    if(kind==='application') {
     const {rows:[open]}=await client.query('SELECT arms_intake.lock_open_job($1) AS available',[values.jobId]);
     if(!open.available) throw new IntakeError('JOB_UNAVAILABLE');
    }
    const {rows:[clock]}=await client.query('SELECT clock_timestamp() AS now');
    const now=new Date(clock.now),id=randomUUID();
    const futureRoles=kind==='talent'||(kind==='application'&&values.talentNetworkOptIn);
    const deadline=kind==='employer'||futureRoles?calendarMonths(now,24):null;
    const inserted=await client.query(`INSERT INTO arms_intake.records(id,request_hash,payload_hash,kind,job_id,payload,notice_version,consent_at,future_roles_opt_in,purpose_delete_after,created_at,updated_at)
     SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$8,$8
     WHERE $4<>'application' OR arms_intake.lock_open_job($5)`,[id,requestHash,payloadHash,kind,values.jobId??null,JSON.stringify(values),policy.version,now,futureRoles,deadline]);
    if(inserted.rowCount!==1) throw new IntakeError('JOB_UNAVAILABLE');
    await client.query('INSERT INTO arms_intake.outbox(id,record_id) VALUES($1,$2)',[randomUUID(),id]);
    // This confirms committed storage only; it makes no email-delivery claim.
    return {referenceId:id,stored:true};
   });
  },
 };
}
function ordinarilyExpired(row,now) {
 const deadlines=[row.application_delete_after,row.purpose_delete_after].filter(Boolean).map(value=>new Date(value).getTime());
 // An ongoing application has an open application purpose, independently of any
 // expired future-role opt-in. Views never renew either purpose.
 if(row.kind==='talent'&&row.status==='withdrawn') return true;
 if(row.kind==='application'&&!row.application_ended_at) return false;
 return deadlines.length>0&&deadlines.every(value=>value<=now);
}
export function intakeReviewService({db,authorize}) {
 async function staff() {
  const actor=await authorize();
  if(!actor||actor.role!=='admin'||!isUuid(actor.id)) throw new IntakeError('FORBIDDEN');
  return actor;
 }
 async function rowForReview(client,id,lock=false) {
  const {rows:[row]}=await client.query(`SELECT ${safeColumns} FROM arms_intake.records WHERE id=$1${lock?' FOR UPDATE':''}`,[id]);
  if(!row) throw new IntakeError('NOT_FOUND');
  const {rows:[clock]}=await client.query('SELECT clock_timestamp() AS now');
  if(ordinarilyExpired(row,new Date(clock.now).getTime())) throw new IntakeError('RETENTION_REVIEW_REQUIRED');
  return row;
 }
 return {
  async list(kind) {
   await staff();if(!intakeKinds.includes(kind)) throw new IntakeError('INVALID_REQUEST');
   // Broad lists intentionally contain no names, phones, emails or CV metadata.
   return (await db.query(`SELECT id,kind,job_id,status,revision,created_at FROM arms_intake.records WHERE kind=$1
    AND NOT(kind='talent' AND status='withdrawn')
    AND (kind='application' AND application_ended_at IS NULL OR greatest(application_delete_after,purpose_delete_after)>statement_timestamp())
    ORDER BY created_at DESC,id LIMIT 50`,[kind])).rows;
  },
  async get(id) {
   const actor=await staff();if(!isUuid(id)) throw new IntakeError('NOT_FOUND');
   return transaction(db,async client=>{
    const row=await rowForReview(client,id);
    await client.query('SELECT arms_intake.record_view($1,$2)',[id,actor.id]);
    return row;
   });
  },
  async changeStatus(id,input) {
   const actor=await staff();
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['status','revision'].includes(key))) throw new IntakeError('INVALID_REQUEST');
   const {status,revision}=input;
   if(!isUuid(id)||typeof status!=='string'||!Number.isInteger(revision)||revision<1||revision>=2147483647) throw new IntakeError('INVALID_REQUEST');
   return transaction(db,async client=>{
    const row=await rowForReview(client,id,true);
    if(row.revision!==revision) throw new IntakeError('CONFLICT');
    if(!transitions[row.kind][row.status]?.includes(status)) throw new IntakeError('INVALID_TRANSITION');
    const {rows:[clock]}=await client.query('SELECT clock_timestamp() AS now');
    const now=new Date(clock.now);
    const ended=row.application_ended_at??(row.kind==='application'&&terminal.has(status)?now:null);
    const deleteAfter=row.application_delete_after??(ended?calendarMonths(ended,12):null);
    await client.query("SELECT set_config('arms.intake_actor',$1,true)",[actor.id]);
    const {rows:[updated]}=await client.query(`UPDATE arms_intake.records SET status=$2,revision=revision+1,application_ended_at=$3,application_delete_after=$4,updated_at=$5 WHERE id=$1 RETURNING ${safeColumns}`,[id,status,ended,deleteAfter,now]);
    return updated;
   });
  },
 };
}
