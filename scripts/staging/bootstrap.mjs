import {Client} from 'pg';
import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {hashPassword} from '../../lib/auth/crypto.mjs';
import {stageConfig,stageRolePassword,stageRoles,stageActorId,stageEmail,stageJobId} from '../../lib/staging/config.mjs';
export async function bootstrapStage(db,env) {
stageConfig(env);
if(typeof env.STAGING_BOOTSTRAP_PASSWORD!=='string'||env.STAGING_BOOTSTRAP_PASSWORD.length<32||typeof env.STAGING_ADMIN_PASSWORD!=='string'||env.STAGING_ADMIN_PASSWORD.length<32)throw new Error('STAGING_SECRETS_REQUIRED');
let phase='connect';
try {
 await db.query('BEGIN');
 if((await db.query("SELECT to_regnamespace('arms_stage') IS NOT NULL AS ready")).rows[0].ready){
  if((await db.query('SELECT value FROM arms_stage.marker')).rows[0]?.value!=='synthetic-only-v1')throw new Error('STAGING_MARKER_INVALID');
  await db.query('ROLLBACK');console.log('Synthetic staging database already initialized.');
 } else {
  for(const role of Object.values(stageRoles))await db.query(`CREATE ROLE ${role} LOGIN PASSWORD '${stageRolePassword(role,env)}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 6`);
  for(const file of ['002_staff_auth.sql','003_staff_runtime_grants.sql','004_jobs.sql','005_jobs_runtime_grants.sql','006_jobs_approval_revision.sql','007_gig_work_industry.sql','008_intake.sql','009_intake_grants.sql','010_private_documents.sql','011_internal_notifications.sql']){phase=file;await db.query(await readFile(new URL('../../database/'+file,import.meta.url),'utf8'));}
  phase='fixtures';
  await db.query("CREATE SCHEMA arms_stage; REVOKE ALL ON SCHEMA arms_stage FROM PUBLIC; CREATE TABLE arms_stage.marker(value text PRIMARY KEY CHECK(value='synthetic-only-v1')); INSERT INTO arms_stage.marker VALUES('synthetic-only-v1'); CREATE TABLE arms_stage.messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL,recipient text NOT NULL CHECK(recipient LIKE '%@example.invalid'),body text NOT NULL CHECK(length(body)<2000),record_id uuid,created_at timestamptz NOT NULL DEFAULT now()); CREATE UNIQUE INDEX stage_message_once ON arms_stage.messages(kind,record_id) WHERE record_id IS NOT NULL; REVOKE ALL ON ALL TABLES IN SCHEMA arms_stage FROM PUBLIC;");
  for(const role of Object.values(stageRoles)){await db.query(`GRANT USAGE ON SCHEMA arms_stage TO ${role}`);await db.query(`GRANT SELECT ON arms_stage.marker TO ${role}`);}
  await db.query('GRANT INSERT ON arms_stage.messages TO arms_staff_runtime; GRANT SELECT,INSERT ON arms_stage.messages TO arms_stage_runtime;');
  await db.query('INSERT INTO arms_auth.staff_users(id,login_id,email,password_hash,role) VALUES($1,$2,$2,$3,\'admin\')',[stageActorId,stageEmail,await hashPassword(env.STAGING_ADMIN_PASSWORD)]);
  await db.query("SELECT set_config('arms.job_actor',$1,true),set_config('arms.job_action','created',true)",[stageActorId]);
  const posting={title:'PRIVATE SYNTHETIC QA FIXTURE — not a vacancy',slug:'private-staging-fixture',industrySlug:'gig-work',location:'Synthetic private test location',employmentType:'Contract',employer:'',payrollModel:'client',experience:'Synthetic fixture only',schedule:'',salaryIsPublic:'no',salaryMin:'',salaryMax:'',salaryPeriod:'monthly',description:'Synthetic test fixture. Not a real opportunity and never served through public jobs.',responsibilities:'Synthetic task only',requirements:'Synthetic requirement only',expiresOn:'2090-12-01'};
  await db.query("INSERT INTO arms_jobs.jobs(id,slug,posting,created_by,expires_at) VALUES($1,$2,$3,$4,'2090-12-01T18:29:59.999Z')",[stageJobId,posting.slug,JSON.stringify(posting),stageActorId]);
  await db.query("SELECT set_config('arms.job_action','published',true)");
  await db.query("UPDATE arms_jobs.jobs SET status='published',revision=2,approved_by=$2,approved_at=now(),approved_revision=2,approval_reference='Private synthetic QA only; not an actual vacancy',published_at=now() WHERE id=$1",[stageJobId,stageActorId]);
  await db.query('COMMIT');console.log('Isolated synthetic staging database initialized; no real data.');
 }
} catch(error) {await db.query('ROLLBACK').catch(()=>{});console.error('Staging initialization failed at '+phase+'. Code '+(/^[0-9A-Z]{5}$/.test(error.code??'')?error.code:'unavailable')+'. No credentials displayed.');throw error;}


}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=stageConfig(process.env),url=new URL('postgresql://postgres@127.0.0.1:5432/'+config.name);url.password=process.env.STAGING_BOOTSTRAP_PASSWORD;
 const db=new Client({connectionString:url.toString(),connectionTimeoutMillis:5000});
 try{await db.connect();await bootstrapStage(db,process.env);}catch{process.exitCode=1;}finally{await db.end();}
}
