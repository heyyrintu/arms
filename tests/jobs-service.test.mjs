import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {jobsService} from '../lib/jobs-service.mjs';
import {emptyJobPosting,parseJobPosting,jobExpiry} from '../lib/job-posting.mjs';
const pg=new PGlite();
await pg.exec(await readFile(new URL('../database/002_staff_auth.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../database/004_jobs.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../database/006_jobs_approval_revision.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../database/007_gig_work_industry.sql',import.meta.url),'utf8'));
await pg.exec('CREATE ROLE arms_jobs_runtime; CREATE ROLE arms_jobs_reader;');
await pg.exec(await readFile(new URL('../database/005_jobs_runtime_grants.sql',import.meta.url),'utf8'));
const actor={id:randomUUID(),role:'admin'};
await pg.query("INSERT INTO arms_auth.staff_users(id,login_id,email,password_hash,role) VALUES($1,'synthetic.admin','jobs@example.invalid','scrypt$131072$8$1$fixture','admin')",[actor.id]);
const db={query:(...args)=>pg.query(...args),connect:async()=>({query:(...args)=>pg.query(...args),release(){}})};
const service=jobsService({db,authorize:async()=>actor});
const posting=()=>({...emptyJobPosting(),title:'Private synthetic job',slug:`private-${randomUUID()}`,industrySlug:'transportation-drivers',location:'Private test location',employmentType:'Contract',payrollModel:'client',description:'Synthetic fixture; never publish to a public site.',responsibilities:'Private test task',requirements:'Private test requirement',expiresOn:'2090-12-01'});
const save=(id,values,revision=0)=>service.mutate(id,{operation:'save',revision,posting:values});
const publish=job=>service.mutate(job.id,{operation:'publish',revision:job.revision,previewedRevision:job.revision,confirmedGenuine:true,approvalReference:'Synthetic isolated test approval only'});
async function publicRows() {await pg.exec('SET ROLE arms_jobs_reader');try{return(await pg.query('SELECT * FROM arms_jobs.public_jobs')).rows;}finally{await pg.exec('RESET ROLE');}}
after(()=>pg.close());
test('server rejects malformed types, unknown keys, controls and disclosure tampering',()=>{
  for(const input of [null,[],{...posting(),title:42},{...posting(),status:'published'},{...posting(),description:'bad\u0000text'},{...posting(),salaryIsPublic:'truthy'}]) assert.ok(Object.keys(parseJobPosting(input).errors).length);
  const values=parseJobPosting({...posting(),salaryMin:'private data',salaryMax:'private data'}).values;
  assert.equal(values.salaryMin,'');assert.equal(values.salaryMax,'');
  assert.equal(jobExpiry({...posting(),expiresOn:'2090-12-01'}).toISOString(),'2090-12-01T18:29:59.999Z');
});
test('all service operations reject anonymous and non-admin identities before touching storage',async()=>{
  for(const user of [null,{...actor,role:'recruiter'},{...actor,role:'business_development'}]) {
    const denied=jobsService({db:{query(){throw new Error('DATABASE_TOUCHED');}},authorize:async()=>user});
    for(const action of [()=>denied.list(),()=>denied.get(randomUUID()),()=>denied.activity(randomUUID()),()=>denied.mutate(randomUUID(),{})]) await assert.rejects(action,/FORBIDDEN/);
  }
});
test('draft save persists, retries do not duplicate, revisions reject lost updates, and slugs are unique',async()=>{
  const id=randomUUID(),values=posting();
  let job=await save(id,values);assert.equal(job.status,'draft');assert.equal(job.revision,1);
  assert.equal((await save(id,values)).revision,1);
  await assert.rejects(()=>save(randomUUID(),values),/SLUG_CONFLICT/);
  await assert.rejects(()=>save(id,{...values,title:'Other change'},0),/CONFLICT/);
  job=await save(id,{...values,title:'Saved revision'},1);assert.equal(job.revision,2);
  await assert.rejects(()=>save(id,values,1),/CONFLICT/);
  assert.equal((await service.get(id)).posting.title,'Saved revision');
  assert.equal((await service.activity(id)).length,2);
  assert.equal((await publicRows()).some(row=>row.id===id),false);
});
test('publishing needs matching preview, genuine confirmation, authorization record, payroll and expiry',async()=>{
  const job=await save(randomUUID(),posting());
  for(const extra of [{},{previewedRevision:0,confirmedGenuine:true,approvalReference:'Test authorization'},{previewedRevision:1,confirmedGenuine:false,approvalReference:'Test authorization'}]) await assert.rejects(()=>service.mutate(job.id,{operation:'publish',revision:1,...extra}),/APPROVAL_REQUIRED/);
  const noExpiry=await save(randomUUID(),{...posting(),expiresOn:''});await assert.rejects(()=>publish(noExpiry),/VALIDATION/);
  const unconfirmed=await save(randomUUID(),{...posting(),payrollModel:'undecided'});await assert.rejects(()=>publish(unconfirmed),/VALIDATION/);
  const live=await publish(job);assert.equal(live.approved_revision,live.revision);
  await assert.rejects(()=>pg.query('UPDATE arms_jobs.jobs SET approved_revision=NULL WHERE id=$1',[job.id]),error=>error.code==='23514'&&error.constraint==='jobs_published_revision_required');
  const row=(await publicRows()).find(row=>row.id===job.id);assert.ok(row);
  for(const key of ['posting','created_by','approved_by','approval_reference','password_hash','salaryMin']) assert.equal(row[key],undefined,key);
  assert.equal(row.salary_min,null);
});
test('editing published content withdraws it; close/archive/restore and expiry stay out of public reads',async()=>{
  let job=await publish(await save(randomUUID(),posting()));
  await assert.rejects(()=>save(job.id,{...job.posting,slug:'changed-public-url'},job.revision),/VALIDATION/);
  job=await save(job.id,{...job.posting,title:'Changed title'},job.revision);
  assert.equal(job.status,'draft');assert.equal(job.approved_by,null);assert.equal((await publicRows()).some(row=>row.id===job.id),false);
  job=await publish(job);job=await service.mutate(job.id,{operation:'close',revision:job.revision});
  assert.equal((await publicRows()).some(row=>row.id===job.id),false);
  await assert.rejects(()=>publish(job),/INVALID_TRANSITION/);
  job=await service.mutate(job.id,{operation:'archive',revision:job.revision});
  job=await service.mutate(job.id,{operation:'restore',revision:job.revision});assert.equal(job.status,'draft');
  job=await publish(job);
  // Isolated owner adjustment simulates time passage while preserving past publication order.
  await pg.query("SELECT set_config('arms.job_actor',$1,false),set_config('arms.job_action','saved',false)",[actor.id]);
  await pg.exec('ALTER TABLE arms_jobs.jobs DISABLE TRIGGER job_activity');
  await pg.query("UPDATE arms_jobs.jobs SET published_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE id=$1",[job.id]);
  await pg.exec('ALTER TABLE arms_jobs.jobs ENABLE TRIGGER job_activity');
  assert.equal((await publicRows()).some(row=>row.id===job.id),false);
});
test('writer cannot change credentials, delete jobs, alter schema or tamper with audit; reader sees only projection',async()=>{
  await pg.exec('SET ROLE arms_jobs_runtime');
  const restricted=jobsService({db,authorize:async()=>actor});
  const job=await restricted.mutate(randomUUID(),{operation:'save',revision:0,posting:posting()});
  assert.ok((await restricted.activity(job.id)).length);
  for(const sql of ['DELETE FROM arms_jobs.jobs','TRUNCATE arms_jobs.jobs','DELETE FROM arms_jobs.activity','UPDATE arms_jobs.activity SET action=\'published\'','CREATE TABLE arms_jobs.bad(id integer)','SELECT password_hash FROM arms_auth.staff_users']) await assert.rejects(()=>pg.exec(sql),/permission denied/);
  await pg.exec('RESET ROLE; SET ROLE arms_jobs_reader');
  await pg.query('SELECT * FROM arms_jobs.public_jobs');
  for(const sql of ['SELECT * FROM arms_jobs.jobs','SELECT * FROM arms_jobs.activity','SELECT * FROM arms_auth.staff_users','INSERT INTO arms_jobs.jobs(id) VALUES(gen_random_uuid())']) await assert.rejects(()=>pg.exec(sql),/permission denied/);
  await pg.exec('RESET ROLE');
});
test('audit failure rolls back job writes and per-admin write limits are enforced',async()=>{
  await pg.exec("CREATE FUNCTION arms_jobs.synthetic_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$; CREATE TRIGGER synthetic_failure BEFORE INSERT ON arms_jobs.activity FOR EACH ROW EXECUTE FUNCTION arms_jobs.synthetic_audit_failure();");
  const id=randomUUID();
  await assert.rejects(()=>save(id,posting()),/synthetic audit failure/);
  assert.equal((await pg.query('SELECT id FROM arms_jobs.jobs WHERE id=$1',[id])).rows.length,0);
  await pg.exec('DROP TRIGGER synthetic_failure ON arms_jobs.activity; DROP FUNCTION arms_jobs.synthetic_audit_failure();');
  await pg.query("UPDATE arms_jobs.write_limits SET attempts=30,window_started_at=now() WHERE actor_id=$1",[actor.id]);
  await assert.rejects(()=>save(randomUUID(),posting()),/RATE_LIMITED/);
});
