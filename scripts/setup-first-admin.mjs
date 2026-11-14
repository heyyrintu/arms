import nextEnv from '@next/env';
import {Client} from 'pg';
import {databaseConfig} from './lib/database-config.mjs';
import {normalizeLogin} from '../lib/auth/crypto.mjs';
import {localStaffSetup} from './lib/local-staff-setup.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client;
try {
  const args=process.argv.slice(2);
  const argument=name=>args.includes(name)?args[args.indexOf(name)+1]:'';
  const login=normalizeLogin(argument('--login-id')),email=argument('--email');
  if(!login||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) throw new Error();
  const minutes=Number(argument('--minutes')||'10'),port=Number(argument('--port')||'0');
  if(!Number.isInteger(minutes)||minutes<1||minutes>60||!Number.isInteger(port)||!(port===0||(port>=1024&&port<=65535))) throw new Error();
  const url=new URL(process.env.DATABASE_URL);
  if(args.includes('--ssh-tunnel')) {
    url.hostname='127.0.0.1';url.port='15499';
    for(const key of [...url.searchParams.keys()]) if(key.startsWith('ssl')||key==='uselibpqcompat') url.searchParams.delete(key);
    url.searchParams.set('sslmode','disable');
  }
  client=new Client(databaseConfig(url.toString()));await client.connect();
  const {rows:[row]}=await client.query('SELECT count(*)::integer AS count FROM arms_auth.staff_users');
  if(row.count!==0) throw new Error();
  const {origin,server}=await localStaffSetup({db:client,login,email,lifetimeMs:minutes*60000,port,onCreated:()=>console.log('First administrator account created; password was not logged. Staff sign-in remains governed by configuration.')});
  console.log(`Private password setup: ${origin} (loopback only; expires after ${minutes} minutes)`);
  server.on('close',()=>client.end());
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{server.close();server.closeAllConnections();});
} catch {
  console.error('Local first-admin setup could not start. Check the tunnel, explicit account details and empty staff table. No credential was displayed.');
  await client?.end().catch(()=>{});process.exitCode=1;
}
