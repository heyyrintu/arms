import {parseJobPosting,jobExpiry} from './job-posting.mjs';
export class JobError extends Error {
  constructor(code,fields={}) {super(code);this.fields=fields;}
}
export const validJobId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const equalPosting=(left,right)=>Object.keys(left).length===Object.keys(right).length&&Object.entries(left).every(([key,value])=>right[key]===value);
export function jobsService({db,authorize}) {
  async function staff() {
    const actor=await authorize();
    if(!actor || actor.role!=='admin' || !validJobId(actor.id)) throw new JobError('FORBIDDEN');
    return actor;
  }
  return {
    async list() {await staff();return (await db.query('SELECT id,slug,posting,status,revision,published_at,expires_at,updated_at FROM arms_jobs.jobs ORDER BY updated_at DESC,id LIMIT 100')).rows;},
    async get(id) {
      await staff();if(!validJobId(id)) throw new JobError('NOT_FOUND');
      const {rows:[job]}=await db.query('SELECT * FROM arms_jobs.jobs WHERE id=$1',[id]);
      if(!job) throw new JobError('NOT_FOUND');return job;
    },
    async activity(id) {await staff();if(!validJobId(id)) throw new JobError('NOT_FOUND');return (await db.query('SELECT action,from_status,to_status,revision,created_at FROM arms_jobs.activity WHERE job_id=$1 ORDER BY id DESC LIMIT 30',[id])).rows;},
    async mutate(id,input) {
      const actor=await staff();
      if(!validJobId(id) || !input || typeof input!=='object' || Array.isArray(input)) throw new JobError('INVALID_REQUEST');
      const operations=['save','publish','close','archive','restore'];
      if(!operations.includes(input.operation) || !Number.isInteger(input.revision) || input.revision<0 || input.revision>2147483646 || Object.keys(input).some(key=>!['operation','revision','posting','previewedRevision','confirmedGenuine','approvalReference'].includes(key))) throw new JobError('INVALID_REQUEST');
      const {rows:[limit]}=await db.query(`INSERT INTO arms_jobs.write_limits(actor_id,window_started_at,attempts) VALUES($1,now(),1)
        ON CONFLICT(actor_id) DO UPDATE SET attempts=CASE WHEN write_limits.window_started_at<now()-interval '1 minute' THEN 1 ELSE write_limits.attempts+1 END,
        window_started_at=CASE WHEN write_limits.window_started_at<now()-interval '1 minute' THEN now() ELSE write_limits.window_started_at END RETURNING attempts`,[actor.id]);
      if(limit.attempts>30) throw new JobError('RATE_LIMITED');
      const parsed=input.operation==='save'?parseJobPosting(input.posting):null;
      if(parsed && !parsed.values) throw new JobError('VALIDATION',parsed.errors);
      const client=await db.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('arms.job_actor',$1,true),set_config('arms.job_action',$2,true)",[actor.id,input.operation==='save'?(input.revision===0?'created':'saved'):({publish:'published',close:'closed',archive:'archived',restore:'restored'})[input.operation]]);
        let {rows:[job]}=await client.query('SELECT * FROM arms_jobs.jobs WHERE id=$1 FOR UPDATE',[id]);
        if(input.operation==='save' && input.revision===0) {
          if(job) {
            if(job.created_by===actor.id && job.status==='draft' && equalPosting(job.posting,parsed.values)) {await client.query('COMMIT');return job;}
            throw new JobError('CONFLICT');
          }
          ({rows:[job]}=await client.query('INSERT INTO arms_jobs.jobs(id,slug,posting,created_by,expires_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING RETURNING *',[id,parsed.values.slug,JSON.stringify(parsed.values),actor.id,jobExpiry(parsed.values)]));
          if(!job) {
            ({rows:[job]}=await client.query('SELECT * FROM arms_jobs.jobs WHERE id=$1',[id]));
            if(!job || job.created_by!==actor.id || job.status!=='draft' || !equalPosting(job.posting,parsed.values)) throw new JobError('CONFLICT');
          }
        } else {
          if(!job) throw new JobError('NOT_FOUND');
          if(job.revision!==input.revision) throw new JobError('CONFLICT');
          if(input.operation==='save') {
            if(['closed','archived'].includes(job.status)) throw new JobError('INVALID_TRANSITION');
            if(job.published_at && parsed.values.slug!==job.slug) throw new JobError('VALIDATION',{slug:'The URL cannot change after first publication.'});
            ({rows:[job]}=await client.query(`UPDATE arms_jobs.jobs SET slug=$2,posting=$3,status='draft',revision=revision+1,
              approved_by=NULL,approved_at=NULL,approved_revision=NULL,approval_reference=NULL,expires_at=$4,updated_at=now() WHERE id=$1 RETURNING *`,[id,parsed.values.slug,JSON.stringify(parsed.values),jobExpiry(parsed.values)]));
          } else if(input.operation==='publish') {
            if(job.status!=='draft') throw new JobError('INVALID_TRANSITION');
            if(input.previewedRevision!==job.revision || input.confirmedGenuine!==true || typeof input.approvalReference!=='string' || input.approvalReference.trim().length<10 || input.approvalReference.length>500 || /[\u0000-\u001f\u007f]/.test(input.approvalReference)) throw new JobError('APPROVAL_REQUIRED');
            const current=parseJobPosting(job.posting);
            if(!current.values || !job.posting.expiresOn || job.posting.payrollModel==='undecided') throw new JobError('VALIDATION',{...(current.errors??{}),...(!job.posting.expiresOn?{expiresOn:'Set a future closing date before publishing.'}:{}),...(job.posting.payrollModel==='undecided'?{payrollModel:'Confirm the payroll arrangement before publishing.'}:{})});
            ({rows:[job]}=await client.query(`UPDATE arms_jobs.jobs SET status='published',revision=revision+1,approved_by=$2,approved_at=now(),
              approved_revision=revision+1,approval_reference=$3,published_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[id,actor.id,input.approvalReference.trim()]));
          } else {
            const allowed={close:['published'],archive:['draft','published','closed'],restore:['closed','archived']};
            if(!allowed[input.operation].includes(job.status)) throw new JobError('INVALID_TRANSITION');
            const status={close:'closed',archive:'archived',restore:'draft'}[input.operation];
            ({rows:[job]}=await client.query(`UPDATE arms_jobs.jobs SET status=$2,revision=revision+1,approved_by=NULL,approved_at=NULL,
              approved_revision=NULL,approval_reference=NULL,updated_at=now() WHERE id=$1 RETURNING *`,[id,status]));
          }
        }
        await client.query('COMMIT');return job;
      } catch(error) {
        await client.query('ROLLBACK').catch(()=>{});
        if(error.code==='23505') throw new JobError('SLUG_CONFLICT');
        throw error;
      } finally {client.release();}
    },
  };
}
