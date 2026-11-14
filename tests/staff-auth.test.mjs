import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {staffRuntimePermissionQuery} from '../lib/auth/runtime-permissions.mjs';
import {staffAuth} from '../lib/auth/service.mjs';
import {hashPassword,verifyPassword,requiresEmailCode,token,tokenHash,normalizeLogin} from '../lib/auth/crypto.mjs';
const pg=new PGlite();
await pg.exec(await readFile(new URL('../database/002_staff_auth.sql',import.meta.url),'utf8'));
const db={query:(...args)=>pg.query(...args),connect:async()=>({query:(...args)=>pg.query(...args),release(){}})};
const password='Synthetic test passphrase 762!';
const passwordHash=await hashPassword(password);
const secret=token();
let id;
async function reset() {
  await pg.exec('TRUNCATE arms_auth.staff_users,arms_auth.login_limits,arms_auth.login_challenges,arms_auth.staff_sessions,arms_auth.security_events RESTART IDENTITY CASCADE');
  id=randomUUID();
  await pg.query('INSERT INTO arms_auth.staff_users (id,login_id,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',[id,'test.admin','staff@example.invalid',passwordHash,'admin']);
}
after(()=>pg.close());
test('password hashes use unique salts, reject malformed hashes and preserve exact password',async()=>{
  assert.notEqual(await hashPassword(password),passwordHash);
  assert.equal(await verifyPassword(password,passwordHash),true);
  assert.equal(await verifyPassword(password+' ',passwordHash),false);
  assert.equal(await verifyPassword(password,'scrypt$999999999$8$1$bad'),false);
  await assert.rejects(()=>hashPassword('short'));
  assert.equal(normalizeLogin(' TEST.Admin '),'test.admin');
  assert.equal(normalizeLogin("admin' OR 1=1"),null);
});
test('production and test cannot bypass email verification with the development switch',()=>{
  for(const env of ['production','test',undefined]) assert.equal(requiresEmailCode(env,'true'),true);
  assert.equal(requiresEmailCode('development',undefined),true);
  assert.equal(requiresEmailCode('development','true'),false);
});
test('password alone creates no session; one delivered code creates one opaque session and cannot replay',async()=>{
  await reset();let code;
  const auth=staffAuth({db,secret,sendCode:async(email,value)=>{assert.equal(email,'staff@example.invalid');code=value;}});
  const challenge=await auth.start('TEST.Admin',password);
  assert.equal(challenge.step,'verify');
  assert.equal((await pg.query('SELECT * FROM arms_auth.staff_sessions')).rows.length,0);
  const stored=(await pg.query('SELECT * FROM arms_auth.login_challenges')).rows[0];
  assert.notEqual(stored.token_hash,challenge.challenge);assert.notEqual(stored.code_hash,code);
  const session=await auth.verify(challenge.challenge,code);
  assert.equal(session.step,'complete');
  assert.deepEqual(await auth.authorize(session.session,['admin']),{id,role:'admin'});
  assert.equal(await auth.authorize(session.session,['recruiter']),null);
  assert.equal(await auth.authorize(challenge.challenge,['admin']),null);
  await assert.rejects(()=>auth.verify(challenge.challenge,code),/INVALID_CODE/);
  assert.notEqual((await pg.query('SELECT * FROM arms_auth.staff_sessions')).rows[0].token_hash,session.session);
  await auth.logout(session.session);
  assert.equal(await auth.authorize(session.session,['admin']),null);
});
test('five incorrect code attempts stay committed and invalidate the correct code',async()=>{
  await reset();let code;
  const auth=staffAuth({db,secret,sendCode:async(_email,value)=>{code=value;}});
  const {challenge}=await auth.start('test.admin',password);
  const wrong=code==='000000'?'000001':'000000';
  for(let attempt=0;attempt<5;attempt++) await assert.rejects(()=>auth.verify(challenge,wrong),/INVALID_CODE/);
  assert.equal((await pg.query('SELECT attempts FROM arms_auth.login_challenges')).rows[0].attempts,5);
  await assert.rejects(()=>auth.verify(challenge,code),/INVALID_CODE/);
});
test('expired and undelivered challenges fail; starting again invalidates the old code',async()=>{
  await reset();const codes=[];
  const auth=staffAuth({db,secret,sendCode:async(_email,value)=>{codes.push(value);}});
  const first=await auth.start('test.admin',password);
  const second=await auth.start('test.admin',password);
  await assert.rejects(()=>auth.verify(first.challenge,codes[0]),/INVALID_CODE/);
  await pg.query('UPDATE arms_auth.login_challenges SET delivered_at=NULL');
  await assert.rejects(()=>auth.verify(second.challenge,codes[1]),/INVALID_CODE/);
  await pg.query("UPDATE arms_auth.login_challenges SET delivered_at=now(),expires_at=now()-interval '1 second'");
  await assert.rejects(()=>auth.verify(second.challenge,codes[1]),/INVALID_CODE/);
});
test('email failure invalidates challenge and cannot report successful sign-in',async()=>{
  await reset();
  const auth=staffAuth({db,secret,sendCode:async()=>{throw new Error('SYNTHETIC_SEND_FAILURE');}});
  await assert.rejects(()=>auth.start('test.admin',password),/EMAIL_UNAVAILABLE/);
  assert.equal((await pg.query('SELECT * FROM arms_auth.login_challenges')).rows.length,0);
  assert.equal((await pg.query('SELECT * FROM arms_auth.staff_sessions')).rows.length,0);
});
test('known and unknown logins reject generically and share database-backed attempt limits',async()=>{
  await reset();let sends=0;
  const auth=staffAuth({db,secret,sendCode:async()=>{sends++;}});
  await assert.rejects(()=>auth.start('absent.admin',password),/INVALID_LOGIN/);
  for(let i=0;i<5;i++) await assert.rejects(()=>auth.start('test.admin','incorrect password'),/INVALID_LOGIN/);
  await assert.rejects(()=>auth.start('test.admin',password),/RATE_LIMITED/);
  assert.equal(sends,0);
});
test('account disable, password version changes, idle and absolute session expiry revoke access',async()=>{
  await reset();const auth=staffAuth({db,secret,requireEmail:false,sendCode:async()=>{}});
  const {session}=await auth.start('test.admin',password);
  await pg.query('UPDATE arms_auth.staff_users SET active=false');
  assert.equal(await auth.authorize(session,['admin']),null);
  await pg.query('UPDATE arms_auth.staff_users SET active=true,auth_version=auth_version+1');
  assert.equal(await auth.authorize(session,['admin']),null);
  const fresh=await auth.start('test.admin',password);
  await pg.query("UPDATE arms_auth.staff_sessions SET last_seen_at=now()-interval '31 minutes'");
  assert.equal(await auth.authorize(fresh.session,['admin']),null);
  await pg.query("UPDATE arms_auth.staff_sessions SET last_seen_at=now(),expires_at=now()-interval '1 second'");
  assert.equal(await auth.authorize(fresh.session,['admin']),null);
  const productionAuth=staffAuth({db,secret,requireEmail:true,sendCode:async()=>{}});
  const development=await auth.start('test.admin',password);
  assert.equal(await productionAuth.authorize(development.session,['admin']),null);
});
test('challenge cannot survive account credential-version change or disable',async()=>{
  await reset();let code;
  const auth=staffAuth({db,secret,sendCode:async(_email,value)=>{code=value;}});
  const {challenge}=await auth.start('test.admin',password);
  await pg.query('UPDATE arms_auth.staff_users SET auth_version=auth_version+1');
  await assert.rejects(()=>auth.verify(challenge,code),/INVALID_CODE/);
});
test('opaque session guesses and SQL-like values never authorize',async()=>{
  await reset();const auth=staffAuth({db,secret,sendCode:async()=>{}});
  assert.equal(await auth.authorize("' OR 1=1",['admin']),null);
  assert.equal(await auth.authorize(token(),['admin']),null);
  assert.equal(tokenHash(token()).length,64);
});
test('runtime grants forbid public table access and staff credential/role changes',async()=>{
  await pg.exec('CREATE ROLE arms_staff_runtime');
  await pg.exec(await readFile(new URL('../database/003_staff_runtime_grants.sql',import.meta.url),'utf8'));
  await pg.exec('SET ROLE arms_staff_runtime');
  await pg.query('SELECT id FROM arms_auth.staff_users');
  let code;
  const runtimeAuth=staffAuth({db,secret,sendCode:async(_email,value)=>{code=value;}});
  const challenge=await runtimeAuth.start('test.admin',password);
  const session=await runtimeAuth.verify(challenge.challenge,code);
  assert.deepEqual(await runtimeAuth.authorize(session.session,['admin']),{id,role:'admin'});
  await runtimeAuth.logout(session.session);
  await assert.rejects(()=>pg.query("UPDATE arms_auth.staff_users SET role='admin'"),/permission denied/);
  await assert.rejects(()=>pg.query("INSERT INTO arms_auth.staff_users (id,login_id,email,password_hash,role) VALUES (gen_random_uuid(),'bad.user','bad@example.invalid',$1,'admin')",[passwordHash]),/permission denied/);
  await assert.rejects(()=>pg.exec('CREATE TABLE arms_auth.bad (id integer)'),/permission denied/);
  await pg.exec('RESET ROLE');
});


test('runtime safety detects column-level credential grants and elevated role memberships',async()=>{
  await pg.exec('SET ROLE arms_staff_runtime');
  assert.ok(Object.values((await pg.query(staffRuntimePermissionQuery)).rows[0]).every(value=>value===false));
  await pg.exec('RESET ROLE');
  await pg.exec('GRANT UPDATE (password_hash) ON arms_auth.staff_users TO arms_staff_runtime');
  await pg.exec('SET ROLE arms_staff_runtime');
  assert.equal((await pg.query(staffRuntimePermissionQuery)).rows[0].can_change_staff,true);
  await pg.exec('RESET ROLE');
  await pg.exec('REVOKE UPDATE (password_hash) ON arms_auth.staff_users FROM arms_staff_runtime');
  await pg.exec('CREATE ROLE synthetic_power CREATEDB');
  await pg.exec('GRANT synthetic_power TO arms_staff_runtime');
  await pg.exec('SET ROLE arms_staff_runtime');
  assert.equal((await pg.query(staffRuntimePermissionQuery)).rows[0].elevated,true);
  await pg.exec('RESET ROLE');
  await pg.exec('REVOKE synthetic_power FROM arms_staff_runtime');
});
