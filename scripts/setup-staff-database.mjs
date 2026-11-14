import nextEnv from '@next/env';
import {Client} from 'pg';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {randomBytes,createHash,pbkdf2Sync,createHmac} from 'node:crypto';
import {staffRuntimePermissionQuery} from '../lib/auth/runtime-permissions.mjs';
import {databaseConfig} from './lib/database-config.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const files=['database/002_staff_auth.sql','database/003_staff_runtime_grants.sql'];
const sources=await Promise.all(files.map(file=>readFile(file,'utf8')));
if(!process.argv.includes('--apply')) {
  console.log(JSON.stringify({applied:false,plan:files.map((file,index)=>({file,sha256:createHash('sha256').update(sources[index]).digest('hex')})),effects:'Create isolated staff schema and restricted runtime role. No staff users, candidate tables, uploads or deployments.'},null,2));
  process.exit(0);
}
let client,runtime;
let committed=false;
try {
  if(!process.env.DATABASE_URL) throw new Error();
  if(process.env.STAFF_DATABASE_URL) throw new Error('ALREADY_CONFIGURED');
  const target=new URL(process.env.DATABASE_URL);
  const tunnel=process.argv.includes('--ssh-tunnel');
  if(tunnel) {
    target.hostname='127.0.0.1';target.port='15499';
    for(const key of [...target.searchParams.keys()]) if(key.startsWith('ssl')||key==='uselibpqcompat') target.searchParams.delete(key);
    target.searchParams.set('sslmode','disable');
  }
  // Pre-read before database writes. No credential appears in stdout or argv.
  let envText=await readFile('.env','utf8');
  if(/^STAFF_DATABASE_URL=/m.test(envText)) throw new Error('ALREADY_CONFIGURED');
  client=new Client(databaseConfig(target.toString()));await client.connect();
  await client.query('BEGIN');
  const {rows:[existing]}=await client.query(`SELECT to_regnamespace('arms_auth') IS NOT NULL AS schema_exists,
    EXISTS(SELECT 1 FROM pg_roles WHERE rolname='arms_staff_runtime') AS role_exists`);
  if(existing.schema_exists||existing.role_exists) throw new Error('EXISTING_RESOURCE_REVIEW_REQUIRED');
  const password=randomBytes(36).toString('base64url');
  const salt=randomBytes(16),iterations=4096;
  const salted=pbkdf2Sync(password,salt,iterations,32,'sha256');
  const clientKey=createHmac('sha256',salted).update('Client Key').digest();
  const storedKey=createHash('sha256').update(clientKey).digest('base64');
  const serverKey=createHmac('sha256',salted).update('Server Key').digest('base64');
  const verifier=`SCRAM-SHA-256$${iterations}:${salt.toString('base64')}$${storedKey}:${serverKey}`;
  // The verifier contains only a validated SCRAM alphabet, not a plaintext password.
  if(!/^[A-Za-z0-9$:+/=.-]+$/.test(verifier)) throw new Error();
  await client.query(`CREATE ROLE arms_staff_runtime LOGIN PASSWORD '${verifier}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 5`);
  await client.query(sources[0]);await client.query(sources[1]);
  await client.query('CREATE TABLE arms_auth.schema_migrations (name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
  for(let i=0;i<files.length;i++) await client.query('INSERT INTO arms_auth.schema_migrations (name,sha256) VALUES ($1,$2)',[files[i],createHash('sha256').update(sources[i]).digest('hex')]);
  await client.query('COMMIT');committed=true;
  target.username='arms_staff_runtime';target.password=password;
  runtime=new Client(databaseConfig(target.toString()));await runtime.connect();
  await runtime.query('BEGIN');
  const {rows:[permissions]}=await runtime.query(staffRuntimePermissionQuery);
  if(Object.values(permissions).some(Boolean)) throw new Error('PERMISSION_CHECK_FAILED');
  await runtime.query('SELECT id,role FROM arms_auth.staff_users LIMIT 0');
  await runtime.query('SAVEPOINT denied_mutation');
  let denied=false;
  try {await runtime.query("UPDATE arms_auth.staff_users SET role='admin' WHERE false");} catch(error){denied=error.code==='42501';}
  await runtime.query('ROLLBACK TO SAVEPOINT denied_mutation');
  if(!denied) throw new Error('PERMISSION_CHECK_FAILED');
  await runtime.query('ROLLBACK');
  envText+=`\n# Restricted staff role; local URL uses the approved SSH tunnel.\nSTAFF_DATABASE_URL=${target.toString()}\n`;
  await writeFile('.env',envText,{mode:0o600});await chmod('.env',0o600);
  console.log(JSON.stringify({applied:true,schema:'arms_auth',restrictedRuntimeRoleVerified:true,staffCredentialMutationsDenied:true,staffUsersCreated:0,applicantTablesCreated:0,authEnabled:false,connectionMode:tunnel?'local-ssh-forward':'direct',deployment:false},null,2));
} catch {
  if(!committed) await client?.query('ROLLBACK').catch(()=>{});
  console.error(JSON.stringify({applied:committed,message:committed?'Staff schema was committed but setup verification or local secret persistence failed. Keep auth disabled and review with the migration operator.':'Staff setup was not applied. Existing resources are never overwritten; check configuration, privileges and connectivity. No credential was displayed.'}));
  process.exitCode=1;
} finally {await runtime?.end().catch(()=>{});await client?.end().catch(()=>{});}
