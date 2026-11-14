import nextEnv from '@next/env';
import {Client} from 'pg';
import {randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {databaseConfig} from './lib/database-config.mjs';
import {hashPassword,normalizeLogin,validPassword} from '../lib/auth/crypto.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client,reader;
try {
  if(!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('INTERACTIVE_TERMINAL_REQUIRED');
  const args=process.argv.slice(2);
  const value=name=>args[args.indexOf(name)+1];
  const login=normalizeLogin(args.includes('--login-id')?value('--login-id'):null);
  const email=args.includes('--email')?value('--email'):'';
  const role=args.includes('--role')?value('--role'):'';
  if(!login || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || !['admin','recruiter','business_development'].includes(role)) throw new Error('ACCOUNT_DETAILS_REQUIRED');
  const url=new URL(process.env.DATABASE_URL);
  if(args.includes('--ssh-tunnel')) {
    url.hostname='127.0.0.1';url.port='15499';
    for(const key of [...url.searchParams.keys()]) if(key.startsWith('ssl')||key==='uselibpqcompat') url.searchParams.delete(key);
    url.searchParams.set('sslmode','disable');
  }
  // A muted terminal prevents password echo/history; never accept a password in
  // argv, env, a public form, logs or a default seed account.
  const muted=new Writable({write(_chunk,_encoding,callback){callback();}});
  reader=createInterface({input:process.stdin,output:muted,terminal:true,historySize:0});
  reader.on('SIGINT',()=>{reader.close();process.exitCode=1;});
  process.stdout.write('New staff password (15+ characters; hidden): ');
  const password=await reader.question('');
  process.stdout.write('\nConfirm password (hidden): ');
  const confirmation=await reader.question('');process.stdout.write('\n');reader.close();
  if(password!==confirmation || !validPassword(password)) throw new Error('PASSWORD_POLICY');
  const hash=await hashPassword(password);
  client=new Client(databaseConfig(url.toString()));await client.connect();
  await client.query('INSERT INTO arms_auth.staff_users (id,login_id,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),login,email,hash,role]);
  console.log('Staff account created. No existing account was changed. Sign-in remains governed by the disabled/enabled configuration and production email-code requirement.');
} catch {
  console.error('Staff creation failed. Check the explicit login/email/role, password confirmation, applied schema and operator connection. No credentials were displayed.');process.exitCode=1;
} finally {reader?.close();await client?.end().catch(()=>{});}
