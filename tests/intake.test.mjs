import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {intakePolicy,calendarMonths} from '../lib/intake/policy.mjs';
import {parseIntake} from '../lib/intake/validation.mjs';
import {intakeSubmissionService,intakeReviewService} from '../lib/intake/service.mjs';
import {jobsService} from '../lib/jobs-service.mjs';
import {emptyJobPosting} from '../lib/job-posting.mjs';
const pg=new PGlite();
for(const file of ['002_staff_auth.sql','004_jobs.sql','006_jobs_approval_revision.sql','007_gig_work_industry.sql','008_intake.sql']) await pg.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
await pg.exec('CREATE ROLE arms_intake_submitter; CREATE ROLE arms_intake_reviewer; CREATE ROLE arms_jobs_reader;');
await pg.exec(await readFile(new URL('../database/009_intake_grants.sql',import.meta.url),'utf8'));
await pg.exec('GRANT USAGE ON SCHEMA arms_jobs TO arms_jobs_reader; GRANT SELECT ON arms_jobs.public_jobs TO arms_jobs_reader;');
const db={query:(...args)=>pg.query(...args),connect:async()=>({query:(...args)=>pg.query(...args),release(){}})};
const actor={id:randomUUID(),role:'admin'};
await pg.query("INSERT INTO arms_auth.staff_users(id,login_id,email,password_hash,role) VALUES($1,'intake.fixture','intake@example.invalid','scrypt$131072$8$1$fixture','admin')",[actor.id]);
const config={db,secret:randomBytes(32),enabled:true,policy:{version:intakePolicy.version,status:'approved'},verifyAbuse:async()=>true};
const service=intakeSubmissionService(config),review=intakeReviewService({db,authorize:async()=>actor});
const context={clientIp:'192.0.2.1'};
const base=()=>({requestId:randomUUID(),name:'Synthetic person',email:'Fixture@Example.invalid',phone:'+91 90000 00000',location:'Private fixture',consent:true,noticeVersion:intakePolicy.version});
const enquiry=()=>({...base(),company:'Synthetic company',industry:'gig-work',headcount:'12',payrollModel:'undecided',requirements:'Synthetic test only; never submit to public site.'});
const talent=()=>({...base(),industry:'cafes-hospitality',preferredRole:'Synthetic role',experience:'Synthetic experience'});
const application=jobId=>({...base(),jobId,experience:'Synthetic experience',talentNetworkOptIn:false});
async function resetLimits(){await pg.exec('TRUNCATE arms_intake.limits');}
async function role(name,run){await pg.exec('SET ROLE '+name);try{return await run();}finally{await pg.exec('RESET ROLE');}}
async function createJob(){
 const jobs=jobsService({db,authorize:async()=>actor});
 const job=await jobs.mutate(randomUUID(),{operation:'save',revision:0,posting:{...emptyJobPosting(),title:'Synthetic isolated job',slug:'private-'+randomUUID(),industrySlug:'gig-work',location:'Private fixture',employmentType:'Contract',payrollModel:'client',description:'Never publish to a real website.',responsibilities:'Synthetic task',requirements:'Synthetic requirement',expiresOn:'2090-12-01'}});
 return jobs.mutate(job.id,{operation:'publish',revision:1,previewedRevision:1,confirmedGenuine:true,approvalReference:'Isolated synthetic test fixture only'});
}
after(()=>pg.close());
test('default draft gate and missing abuse verifier refuse input before storage',async()=>{
 assert.equal(intakePolicy.status,'draft');
 const untouched={query(){throw new Error('DATABASE_TOUCHED');}};
 for(const patch of [{enabled:false},{policy:intakePolicy},{secret:Buffer.alloc(3)},{verifyAbuse:undefined}]) await assert.rejects(()=>intakeSubmissionService({...config,db:untouched,...patch}).submit('employer',enquiry(),context),/UNAVAILABLE/);
 await assert.rejects(()=>intakeSubmissionService({...config,db:untouched,verifyAbuse:async()=>false}).submit('employer',enquiry(),context),/ABUSE_REJECTED/);
 await assert.rejects(()=>intakeSubmissionService({...config,db:untouched}).submit('employer',enquiry(),{clientIp:'untrusted'}),/UNAVAILABLE/);
});
test('strict validation normalizes contacts, supports Hindi/four industries and rejects tampering',()=>{
 const valid=parseIntake('employer',{...enquiry(),name:'परीक्षण व्यक्ति'},intakePolicy.version);
 assert.equal(valid.values.phone,'+919000000000');assert.equal(valid.values.email,'fixture@example.invalid');
 for(const industry of ['warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work']) assert.ok(parseIntake('talent',{...talent(),industry},intakePolicy.version).values);
 for(const input of [null,[],{...enquiry(),status:'won'},{...enquiry(),consent:'true'},{...enquiry(),noticeVersion:'old'},{...enquiry(),name:'x\u0000'},{...enquiry(),headcount:'1.5'},{...enquiry(),phone:'9000000000'},{...enquiry(),company:'x'.repeat(121)},{...enquiry(),resume:'private.pdf'},{...enquiry(),email:'bad\r\n@example.invalid'}]) assert.ok(parseIntake('employer',input,intakePolicy.version).errors);
 assert.ok(parseIntake('application',{...application(randomUUID()),talentNetworkOptIn:'false'},intakePolicy.version).errors);
});
test('calendar-month retention clamps month ends and preserves UTC time',()=>{
 assert.equal(calendarMonths('2024-02-29T23:59:59.001Z',12).toISOString(),'2025-02-28T23:59:59.001Z');
 assert.equal(calendarMonths('2025-01-31T12:10:00Z',1).toISOString(),'2025-02-28T12:10:00.000Z');
 assert.equal(calendarMonths('2026-11-15T05:00:00Z',24).toISOString(),'2028-11-15T05:00:00.000Z');
 assert.throws(()=>calendarMonths('invalid',12),/INVALID_RETENTION_DATE/);
});
test('restricted submitter saves once with consent, minimal outbox and no saved PII read privileges',async()=>{
 await resetLimits();const input=enquiry();
 await role('arms_intake_submitter',async()=>{
  const first=await service.submit('employer',input,context),second=await service.submit('employer',input,context);
  assert.deepEqual(first,second);assert.deepEqual(Object.keys(first).sort(),['referenceId','stored']);
  await assert.rejects(()=>service.submit('employer',{...input,company:'Different'},context),/CONFLICT/);
  for(const sql of ['SELECT payload FROM arms_intake.records','UPDATE arms_intake.records SET status=\'won\'','DELETE FROM arms_intake.records','TRUNCATE arms_intake.records','SELECT * FROM arms_auth.staff_users','UPDATE arms_jobs.jobs SET status=\'closed\'','SELECT * FROM arms_intake.activity','CREATE TABLE arms_intake.bad(id integer)']) await assert.rejects(()=>pg.exec(sql),/permission denied/);
 });
 const {rows:[row]}=await pg.query("SELECT * FROM arms_intake.records WHERE payload->>'company'='Synthetic company'");
 assert.equal(row.notice_version,intakePolicy.version);assert.equal(row.future_roles_opt_in,false);assert.equal(row.status,'received');assert.equal(row.application_delete_after,null);
 assert.equal(new Date(row.purpose_delete_after).toISOString(),calendarMonths(row.created_at,24).toISOString());
 const {rows:queue}=await pg.query('SELECT * FROM arms_intake.outbox WHERE record_id=$1',[row.id]);assert.equal(queue.length,1);assert.equal(queue[0].state,'pending');assert.equal(queue[0].email,undefined);
 assert.equal((await pg.query('SELECT * FROM arms_intake.activity WHERE record_id=$1',[row.id])).rows.length,1);
});
test('closed/draft/expired/unknown jobs fail; open job accepted and application opt-in is separate',async()=>{
 await resetLimits();const job=await createJob();
 const input=application(job.id);
 const first=await role('arms_intake_submitter',()=>service.submit('application',input,context));
 const row=(await pg.query('SELECT * FROM arms_intake.records WHERE id=$1',[first.referenceId])).rows[0];
 assert.equal(row.future_roles_opt_in,false);assert.equal(row.purpose_delete_after,null);assert.equal(row.application_delete_after,null);
 await pg.query("SELECT set_config('arms.job_actor',$1,false),set_config('arms.job_action','closed',false)",[actor.id]);
 await pg.query("UPDATE arms_jobs.jobs SET status='closed',revision=revision+1,approved_by=NULL,approved_at=NULL,approved_revision=NULL WHERE id=$1",[job.id]);
 assert.deepEqual(await role('arms_intake_submitter',()=>service.submit('application',input,context)),first);
 for(const id of [job.id,randomUUID()]) await assert.rejects(()=>role('arms_intake_submitter',()=>service.submit('application',application(id),context)),/JOB_UNAVAILABLE/);
 await resetLimits();const open=await createJob();
 const opted=await service.submit('application',{...application(open.id),talentNetworkOptIn:true},context);
 const optedRow=(await pg.query('SELECT * FROM arms_intake.records WHERE id=$1',[opted.referenceId])).rows[0];
 assert.equal(optedRow.future_roles_opt_in,true);assert.ok(optedRow.purpose_delete_after);
 // Simulate expiration and draft state as isolated schema owner, never hosted.
 await pg.exec('ALTER TABLE arms_jobs.jobs DISABLE TRIGGER job_activity');
 await pg.query("UPDATE arms_jobs.jobs SET published_at=now()-interval '2 days',expires_at=now()-interval '1 second' WHERE id=$1",[open.id]);
 await assert.rejects(()=>service.submit('application',application(open.id),context),/JOB_UNAVAILABLE/);
 await pg.query("UPDATE arms_jobs.jobs SET status='draft' WHERE id=$1",[open.id]);
 await assert.rejects(()=>service.submit('application',application(open.id),context),/JOB_UNAVAILABLE/);
 await pg.exec('ALTER TABLE arms_jobs.jobs ENABLE TRIGGER job_activity');
});
test('all review operations authorize before storage; lists omit contacts; reads audit; status is revision checked',async()=>{
 for(const user of [null,{...actor,role:'recruiter'},{...actor,role:'business_development'}]) {
  const denied=intakeReviewService({db:{query(){throw new Error('DATABASE_TOUCHED');}},authorize:async()=>user});
  for(const run of [()=>denied.list('employer'),()=>denied.get(randomUUID()),()=>denied.changeStatus(randomUUID(),{status:'closed',revision:1})]) await assert.rejects(run,/FORBIDDEN/);
 }
 await resetLimits();const receipt=await service.submit('talent',talent(),context);
 await role('arms_intake_reviewer',async()=>{
  const list=await review.list('talent');assert.ok(list.some(row=>row.id===receipt.referenceId));
  for(const row of list) for(const key of ['payload','phone','email','name','request_hash','payload_hash']) assert.equal(row[key],undefined);
  const row=await review.get(receipt.referenceId);assert.equal(row.payload.name,'Synthetic person');
  const changed=await review.changeStatus(row.id,{status:'reviewing',revision:row.revision});assert.equal(changed.revision,2);
  await assert.rejects(()=>review.changeStatus(row.id,{status:'withdrawn',revision:1}),/CONFLICT/);
  await assert.rejects(()=>review.changeStatus(row.id,{status:'hired',revision:2}),/INVALID_TRANSITION/);
  await review.changeStatus(row.id,{status:'withdrawn',revision:2});
  await assert.rejects(()=>review.get(row.id),/RETENTION_REVIEW_REQUIRED/);
  assert.equal((await review.list('talent')).some(item=>item.id===row.id),false);
  for(const sql of ['SELECT request_hash FROM arms_intake.records','UPDATE arms_intake.records SET payload=\'{}\'','DELETE FROM arms_intake.activity','UPDATE arms_intake.activity SET action=\'viewed\'','SELECT * FROM arms_auth.staff_users']) await assert.rejects(()=>pg.exec(sql),/permission denied/);
 });
 assert.ok((await pg.query("SELECT * FROM arms_intake.activity WHERE record_id=$1 AND action='viewed'",[receipt.referenceId])).rows.length);
});
test('terminal application decisions set a separate 12-month clock without renewing future opt-in',async()=>{
 await resetLimits();const job=await createJob();const receipt=await service.submit('application',{...application(job.id),talentNetworkOptIn:true},context);
 await role('arms_intake_reviewer',async()=>{
  const before=await review.get(receipt.referenceId);
  const after=await review.changeStatus(before.id,{status:'withdrawn',revision:1});
  assert.equal(new Date(after.application_delete_after).toISOString(),calendarMonths(after.application_ended_at,12).toISOString());
  assert.equal(new Date(after.purpose_delete_after).toISOString(),new Date(before.purpose_delete_after).toISOString());
 });
});
test('outbox/audit failure rolls back submission and retry remains safe',async()=>{
 await resetLimits();
 await pg.exec("CREATE FUNCTION arms_intake.fail_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture failure'; END $$; CREATE TRIGGER fail_outbox BEFORE INSERT ON arms_intake.outbox FOR EACH ROW EXECUTE FUNCTION arms_intake.fail_fixture();");
 const input=enquiry();const count=Number((await pg.query('SELECT count(*) AS n FROM arms_intake.records')).rows[0].n);
 await assert.rejects(()=>service.submit('employer',input,context),/fixture failure/);
 assert.equal(Number((await pg.query('SELECT count(*) AS n FROM arms_intake.records')).rows[0].n),count);
 await pg.exec('DROP TRIGGER fail_outbox ON arms_intake.outbox');
 assert.ok((await service.submit('employer',input,context)).stored);
 const before=Number((await pg.query('SELECT count(*) AS n FROM arms_intake.activity')).rows[0].n);
 await pg.exec('CREATE TRIGGER fail_audit BEFORE INSERT ON arms_intake.activity FOR EACH ROW EXECUTE FUNCTION arms_intake.fail_fixture();');
 await assert.rejects(()=>service.submit('talent',talent(),context),/fixture failure/);
 assert.equal(Number((await pg.query('SELECT count(*) AS n FROM arms_intake.activity')).rows[0].n),before);
 await pg.exec('DROP TRIGGER fail_audit ON arms_intake.activity; DROP FUNCTION arms_intake.fail_fixture();');
});
test('per-identity durable budgets apply across instances and failed submissions',async()=>{
 await resetLimits();const input=enquiry();
 for(let index=0;index<5;index++) await service.submit('employer',input,{clientIp:`192.0.2.${index+1}`});
 const another=intakeSubmissionService(config);
 await assert.rejects(()=>another.submit('employer',enquiry(),{clientIp:'192.0.2.50'}),/RATE_LIMITED/);
 const rows=(await pg.query('SELECT * FROM arms_intake.limits')).rows;
 assert.ok(rows.every(row=>/^[0-9a-f]{64}$/.test(row.key_hash)));assert.ok(rows.some(row=>row.attempts===6));
});
test('public job reader has no intake access',async()=>{
 await role('arms_jobs_reader',async()=>{
  await pg.query('SELECT * FROM arms_jobs.public_jobs');
  for(const sql of ['SELECT * FROM arms_intake.records','SELECT * FROM arms_intake.outbox','SELECT * FROM arms_intake.activity']) await assert.rejects(()=>pg.exec(sql),/permission denied/);
 });
});
test('audit read failure refuses to release a personal record; deactivated actor is denied in SQL',async()=>{
 await resetLimits();const receipt=await service.submit('employer',enquiry(),context);
 await pg.exec("CREATE FUNCTION arms_intake.deny_read_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit unavailable'; END $$; CREATE TRIGGER deny_read BEFORE INSERT ON arms_intake.activity FOR EACH ROW WHEN (NEW.action='viewed') EXECUTE FUNCTION arms_intake.deny_read_fixture();");
 await assert.rejects(()=>role('arms_intake_reviewer',()=>review.get(receipt.referenceId)),/audit unavailable/);
 await pg.exec('DROP TRIGGER deny_read ON arms_intake.activity; DROP FUNCTION arms_intake.deny_read_fixture();');
 for(const value of [null,[],{status:'closed',revision:1,actorId:randomUUID()}]) await assert.rejects(()=>review.changeStatus(receipt.referenceId,value),/INVALID_REQUEST/);
 await pg.query('UPDATE arms_auth.staff_users SET active=false WHERE id=$1',[actor.id]);
 try {
  await assert.rejects(()=>role('arms_intake_reviewer',()=>review.get(receipt.referenceId)),/intake administrator required/);
  await assert.rejects(()=>role('arms_intake_reviewer',()=>review.changeStatus(receipt.referenceId,{status:'closed',revision:1})),/intake administrator required/);
 } finally {await pg.query('UPDATE arms_auth.staff_users SET active=true WHERE id=$1',[actor.id]);}
});
test('expired purpose records stay out of routine review and reads do not extend retention',async()=>{
 await resetLimits();const receipt=await service.submit('employer',enquiry(),context);
 const original=(await pg.query('SELECT purpose_delete_after FROM arms_intake.records WHERE id=$1',[receipt.referenceId])).rows[0].purpose_delete_after;
 await review.get(receipt.referenceId);
 assert.equal(new Date((await pg.query('SELECT purpose_delete_after FROM arms_intake.records WHERE id=$1',[receipt.referenceId])).rows[0].purpose_delete_after).toISOString(),new Date(original).toISOString());
 // Isolated owner simulates an old record; runtime cannot modify these clocks.
 await pg.exec('ALTER TABLE arms_intake.records DISABLE TRIGGER intake_change');
 await pg.query("UPDATE arms_intake.records SET created_at=now()-interval '3 years',purpose_delete_after=now()-interval '1 second' WHERE id=$1",[receipt.referenceId]);
 await pg.exec('ALTER TABLE arms_intake.records ENABLE TRIGGER intake_change');
 assert.equal((await review.list('employer')).some(row=>row.id===receipt.referenceId),false);
 await assert.rejects(()=>review.get(receipt.referenceId),/RETENTION_REVIEW_REQUIRED/);
});
