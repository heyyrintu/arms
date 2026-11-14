import nextEnv from '@next/env';
import {Client} from 'pg';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {randomBytes,createHash,pbkdf2Sync,createHmac} from 'node:crypto';
import {databaseConfig} from './lib/database-config.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const files=['database/004_jobs.sql','database/005_jobs_runtime_grants.sql','database/006_jobs_approval_revision.sql','database/007_gig_work_industry.sql'];
const sources=await Promise.all(files.map(file=>readFile(file,'utf8')));
if(!process.argv.includes('--apply')) {
  console.log(JSON.stringify({applied:false,files:files.map((file,i)=>({file,sha256:createHash('sha256').update(sources[i]).digest('hex')})),effects:'Create isolated jobs schema, append-only activity, public projection and two restricted logins. No job records, staff changes, applicant tables or deployment.'},null,2));process.exit(0);
}
function verifier(password) {
  const salt=randomBytes(16),iterations=4096,salted=pbkdf2Sync(password,salt,iterations,32,'sha256');
  const stored=createHash('sha256').update(createHmac('sha256',salted).update('Client Key').digest()).digest('base64');
  const server=createHmac('sha256',salted).update('Server Key').digest('base64');
  return `SCRAM-SHA-256$${iterations}:${salt.toString('base64')}$${stored}:${server}`;
}
let client;let committed=false;
try {
  const env=await readFile('.env','utf8');
  if(process.env.JOBS_DATABASE_URL||process.env.JOBS_PUBLIC_DATABASE_URL||/^JOBS_(?:PUBLIC_)?DATABASE_URL=/m.test(env)) throw new Error('ALREADY_CONFIGURED');
  const url=new URL(process.env.DATABASE_URL);
  if(process.argv.includes('--ssh-tunnel')) {
    url.hostname='127.0.0.1';url.port='15499';for(const key of [...url.searchParams.keys()]) if(key.startsWith('ssl')||key==='uselibpqcompat')url.searchParams.delete(key);url.searchParams.set('sslmode','disable');
  }
  client=new Client(databaseConfig(url.toString()));await client.connect();await client.query('BEGIN');
  const {rows:[existing]}=await client.query("SELECT to_regnamespace('arms_jobs') IS NOT NULL OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN ('arms_jobs_runtime','arms_jobs_reader')) AS exists");
  if(existing.exists) throw new Error('EXISTING_RESOURCES');
  const credentials=[];
  for(const name of ['arms_jobs_runtime','arms_jobs_reader']) {
    const password=randomBytes(36).toString('base64url'),hash=verifier(password);
    if(!/^[A-Za-z0-9$:+/=.-]+$/.test(hash)) throw new Error();
    await client.query(`CREATE ROLE ${name} LOGIN PASSWORD '${hash}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 4`);
    const target=new URL(url);target.username=name;target.password=password;credentials.push(target.toString());
  }
  for(const source of sources) await client.query(source);
  for(let i=0;i<files.length;i++)await client.query('INSERT INTO arms_jobs.schema_migrations(name,sha256) VALUES($1,$2)',[files[i],createHash('sha256').update(sources[i]).digest('hex')]);
  await client.query('COMMIT');committed=true;
  // Persist secrets only to the existing ignored operator file. Never print them.
  await writeFile('.env',`${env}\n# Isolated job writer and public-view reader; local SSH forward only.\nJOBS_DATABASE_URL=${credentials[0]}\nJOBS_PUBLIC_DATABASE_URL=${credentials[1]}\nJOBS_ENABLED=true\n`,{mode:0o600});await chmod('.env',0o600);
  console.log(JSON.stringify({applied:true,schema:'arms_jobs',restrictedLogins:2,jobRecordsCreated:0,applicantTablesCreated:0,staffAuthEnabled:process.env.STAFF_AUTH_ENABLED==='true',deployment:false}));
} catch {
  if(!committed)await client?.query('ROLLBACK').catch(()=>{});
  console.error(JSON.stringify({applied:committed,message:committed?'Jobs schema committed but local secret persistence failed. Review as operator; do not rerun setup.':'Jobs setup not applied. Check approved private connection, existing resources and privileges. No secrets displayed.'}));process.exitCode=1;
} finally {await client?.end().catch(()=>{});}
