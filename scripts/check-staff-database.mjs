import nextEnv from '@next/env';
import {Client} from 'pg';
import {databaseConfig} from './lib/database-config.mjs';
import {staffRuntimePermissionQuery} from '../lib/auth/runtime-permissions.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client;
try {
  if(!process.env.STAFF_DATABASE_URL) throw new Error();
  client=new Client(databaseConfig(process.env.STAFF_DATABASE_URL));await client.connect();
  await client.query('BEGIN READ ONLY');
  const {rows:[permissions]}=await client.query(staffRuntimePermissionQuery);
  const {rows:[aggregate]}=await client.query('SELECT count(*)::integer AS staff_count FROM arms_auth.staff_users');
  await client.query('ROLLBACK');
  const safe=Object.values(permissions).every(value=>value===false);
  console.log(JSON.stringify({connected:true,readOnly:true,restrictedRuntimeVerified:safe,staffAccounts:aggregate.staff_count,authEnabled:process.env.STAFF_AUTH_ENABLED==='true'},null,2));
  if(!safe) process.exitCode=1;
} catch {
  console.error(JSON.stringify({connected:false,readOnly:true,message:'Staff database verification failed. Check the approved SSH tunnel, restricted URL, schema and grants; no credentials were displayed.'}));process.exitCode=1;
} finally {await client?.end().catch(()=>{});}
