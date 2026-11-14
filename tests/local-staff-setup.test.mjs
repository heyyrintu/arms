import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {localStaffSetup} from '../scripts/lib/local-staff-setup.mjs';
import {verifyPassword} from '../lib/auth/crypto.mjs';
test('first-admin setup is local, CSRF protected, one-use and stores only a password hash',async()=>{
  const pg=new PGlite();
  await pg.exec(await readFile(new URL('../database/002_staff_auth.sql',import.meta.url),'utf8'));
  const {origin,server,isComplete}=await localStaffSetup({db:pg,login:'owner@example.invalid',email:'owner@example.invalid',lifetimeMs:60*60*1000});
  try {
    assert.equal(server.address().address,'127.0.0.1');
    const page=await fetch(origin);
    assert.match(page.headers.get('cache-control'),/no-store/);
    // Regression: no-referrer changed native browser form POST Origin to null.
    assert.equal(page.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
    assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
    const html=await page.text();
    assert.match(html,/expires in 60 minutes/);
    const csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
    const cookie=page.headers.get('set-cookie').split(';')[0];
    const password='Synthetic owner passphrase 928!';
    const body=new URLSearchParams({csrf,password,confirmation:password});
    const headers={Origin:origin,Cookie:cookie};
    assert.equal((await fetch(origin+'/create',{method:'POST',body})).status,403);
    assert.equal((await fetch(origin+'/create',{method:'POST',body,headers:{...headers,Origin:'https://untrusted.example.invalid'}})).status,403);
    assert.equal((await fetch(origin+'/create',{method:'POST',body,headers:{...headers,Origin:'null'}})).status,403);
    assert.equal((await fetch(origin+'/create',{method:'POST',body,headers:{Origin:origin}})).status,403);
    assert.equal((await fetch(origin+'/create',{method:'POST',headers,body:new URLSearchParams({csrf:'wrong-token',password,confirmation:password})})).status,403);
    assert.equal((await fetch(origin+'/create',{method:'POST',body,headers:{...headers,'Sec-Fetch-Site':'cross-site'}})).status,403);
    const invalid=await fetch(origin+'/create',{method:'POST',headers,body:new URLSearchParams({csrf,password:'short',confirmation:'short'})});
    assert.equal(invalid.status,400);assert.equal(isComplete(),false);
    const created=await fetch(origin+'/create',{method:'POST',headers,body,redirect:'manual'});
    assert.equal(created.status,303);assert.equal(isComplete(),true);
    const {rows:[staff]}=await pg.query('SELECT * FROM arms_auth.staff_users');
    assert.equal(staff.role,'admin');assert.notEqual(staff.password_hash,password);assert.equal(await verifyPassword(password,staff.password_hash),true);
    assert.equal((await fetch(origin+'/create',{method:'POST',headers,body})).status,409);
    assert.match(await(await fetch(origin)).text(),/Administrator account created/);
  } finally {await new Promise(resolve=>server.close(resolve));await pg.close();}
});


test('local setup refuses unbounded lifetimes and privileged ports',async()=>{
  const settings={db:{},login:'owner@example.invalid',email:'owner@example.invalid'};
  for(const lifetimeMs of [0,Infinity,61*60*1000]) await assert.rejects(()=>localStaffSetup({...settings,lifetimeMs}));
  for(const port of [80,-1,65536]) await assert.rejects(()=>localStaffSetup({...settings,port}));
});
