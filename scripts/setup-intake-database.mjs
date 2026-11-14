import nextEnv from '@next/env';
import {Client} from 'pg';
import {readFile,open,rename,unlink,chmod} from 'node:fs/promises';
import {randomBytes,createHash,pbkdf2Sync,createHmac} from 'node:crypto';
import {databaseConfig} from './lib/database-config.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const files=['008_intake.sql','009_intake_grants.sql','010_private_documents.sql','011_internal_notifications.sql'];
const sources=await Promise.all(files.map(file=>readFile(new URL('../database/'+file,import.meta.url),'utf8')));
const names=['arms_intake_submitter','arms_intake_reviewer','arms_cv_processor','arms_intake_notifier'];
const keys=['INTAKE_SUBMIT_DATABASE_URL','INTAKE_REVIEW_DATABASE_URL','CV_PROCESSOR_DATABASE_URL','INTAKE_NOTIFIER_DATABASE_URL'];
const plan={files:files.map((name,i)=>({name,sha256:createHash('sha256').update(sources[i]).digest('hex')})),roles:names,recordsCreated:0,publicCollection:false,staffAuthEnabled:process.env.STAFF_AUTH_ENABLED==='true',deployment:false};
if(!process.argv.includes('--apply')){console.log(JSON.stringify({applied:false,...plan},null,2));process.exit(0);}
if(process.argv.slice(2).some(flag=>!['--apply','--ssh-tunnel'].includes(flag)))throw new Error('Unsupported setup flag');
function verifier(password){
 const salt=randomBytes(16),iterations=4096,salted=pbkdf2Sync(password,salt,iterations,32,'sha256');
 return `SCRAM-SHA-256$${iterations}:${salt.toString('base64')}$${createHash('sha256').update(createHmac('sha256',salted).update('Client Key').digest()).digest('base64')}:${createHmac('sha256',salted).update('Server Key').digest('base64')}`;
}
let db,committed=false,commitAttempted=false,pendingCreated=false;
const pending='.env.intake-setup.pending';
try {
 const env=await readFile('.env','utf8');
 if(keys.some(key=>process.env[key]||new RegExp('^'+key+'=','m').test(env)))throw new Error('ALREADY_CONFIGURED');
 if(!process.env.DATABASE_URL)throw new Error('CONFIG');
 const url=new URL(process.env.DATABASE_URL);
 if(process.argv.includes('--ssh-tunnel')){url.hostname='127.0.0.1';url.port='15499';for(const key of [...url.searchParams.keys()])if(key.startsWith('ssl')||key==='uselibpqcompat')url.searchParams.delete(key);url.searchParams.set('sslmode','disable');}
 db=new Client(databaseConfig(url.toString()));await db.connect();await db.query('BEGIN');
 await db.query("SELECT pg_advisory_xact_lock(hashtextextended('arms-intake-bootstrap',0))");
 const {rows:[existing]}=await db.query("SELECT to_regnamespace('arms_intake') IS NOT NULL OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname=ANY($1::text[])) AS exists",[names]);
 if(existing.exists)throw new Error('EXISTING_RESOURCES');
 const credentials=[];
 for(const name of names){
  const password=randomBytes(36).toString('base64url'),hash=verifier(password);
  if(!/^[A-Za-z0-9$:+/=.-]+$/.test(hash))throw new Error('VERIFIER');
  await db.query(`CREATE ROLE ${name} LOGIN PASSWORD '${hash}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 3`);
  await db.query(`ALTER ROLE ${name} SET search_path=pg_catalog`);
  await db.query(`ALTER ROLE ${name} SET statement_timeout='3s'`);
  await db.query(`ALTER ROLE ${name} SET idle_in_transaction_session_timeout='30s'`);
  const target=new URL(url);target.username=name;target.password=password;credentials.push(target.toString());
 }
 for(const source of sources)await db.query(source);
 await db.query('CREATE TABLE arms_intake.schema_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
 for(let i=0;i<files.length;i++)await db.query('INSERT INTO arms_intake.schema_migrations(name,sha256) VALUES($1,$2)',[files[i],plan.files[i].sha256]);
 const additional='\n# Private intake roles; loopback SSH only. Collection stays disabled.\n'+keys.map((key,i)=>key+'='+credentials[i]).join('\n')+'\nINTAKE_HMAC_SECRET='+randomBytes(32).toString('base64url')+'\nINTAKE_REVIEW_ENABLED=false\nPRIVATE_CV_DOWNLOADS_ENABLED=false\nINTERNAL_NOTIFICATIONS_ENABLED=false\n';
 const file=await open(pending,'wx',0o600);pendingCreated=true;
 try{await file.writeFile(env+additional);await file.sync();}finally{await file.close();}
 if(await readFile('.env','utf8')!==env)throw new Error('CONFIG_CHANGED');
 commitAttempted=true;await db.query('COMMIT');committed=true;
 await rename(pending,'.env');await chmod('.env',0o600);pendingCreated=false;
 console.log(JSON.stringify({applied:true,...plan,secretLocation:'ignored .env (0600)'}));
} catch {
 if(!committed)await db?.query('ROLLBACK').catch(()=>{});
 // Preserve pending credentials after an uncertain COMMIT; never blindly rerun.
 if(pendingCreated&&!commitAttempted)await unlink(pending).catch(()=>{});
 console.error(JSON.stringify({applied:committed,reviewRequired:commitAttempted,message:commitAttempted?'Check committed resources and private pending configuration before any retry. No secrets displayed.':'Setup not applied. Check approved connection, privileges or existing resources. No secrets displayed.'}));process.exitCode=1;
} finally {await db?.end().catch(()=>{});}
