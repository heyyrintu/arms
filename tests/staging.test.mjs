import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {stageConfig,stageRoleUrl,stageRoles,stageNotice} from '../lib/staging/config.mjs';
import {issueGate,verifyGate,unlockGate} from '../lib/staging/gate.mjs';
import {syntheticCase} from '../lib/staging/fixtures.mjs';
import {parseIntake} from '../lib/intake/validation.mjs';
import {stageFileStore} from '../lib/staging/file-store.mjs';
const env={ARMS_PRIVATE_STAGING:'true',STAGING_DATABASE_NAME:'arms_private_stage',STAGING_RUNTIME_SECRET:'x'.repeat(43),STAGING_GATE_PASSWORD:'y'.repeat(43)};
test('staging refuses wrong databases and actual cloud credentials',()=>{
 assert.equal(stageConfig(env).name,'arms_private_stage');
 for(const change of [{ARMS_PRIVATE_STAGING:'false'},{STAGING_DATABASE_NAME:'postgres'},{STAGING_RUNTIME_SECRET:'short'},{DATABASE_URL:'postgres://actual'},{SES_ACCESS_KEY_ID:'actual'},{LIGHTSAIL_BUCKET_SECRET_ACCESS_KEY:'actual'}])assert.throws(()=>stageConfig({...env,...change}));
 const url=new URL(stageRoleUrl(stageRoles.submit,env));assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/arms_private_stage');assert.equal(url.username,'arms_intake_submitter');
 assert.throws(()=>stageRoleUrl('postgres',env));
});
test('gate cookies reject tampering, expiry, missing configuration and wrong passwords',()=>{
 const now=Date.now(),cookie=issueGate(env,now);
 assert.ok(verifyGate(cookie,env,now));assert.equal(verifyGate(cookie+'x',env,now),false);assert.equal(verifyGate(cookie,env,now+28800000),false);assert.equal(verifyGate(cookie,{},now),false);
 assert.equal(unlockGate('wrong',env),false);assert.ok(unlockGate(env.STAGING_GATE_PASSWORD,env));assert.equal(verifyGate(cookie,{...env,STAGING_GATE_PASSWORD:'z'.repeat(43)},now),false);
});
test('memorable preview passwords retain independent strong signing and reset invalidation',()=>{
 const configured={...env,STAGING_GATE_PASSWORD:'preview-phrase'},now=Date.now(),cookie=issueGate(configured,now);
 assert.ok(unlockGate('preview-phrase',configured));assert.equal(unlockGate('another-phrase',configured),false);
 assert.ok(verifyGate(cookie,configured,now));
 assert.equal(verifyGate(cookie,{...configured,STAGING_GATE_PASSWORD:'replacement-phrase'},now),false);
 assert.equal(verifyGate(cookie,{...configured,STAGING_RUNTIME_SECRET:'z'.repeat(43)},now),false);
 for(const change of [{STAGING_GATE_PASSWORD:'short'},{STAGING_GATE_PASSWORD:'x'.repeat(257)},{STAGING_RUNTIME_SECRET:'short'},{STAGING_RUNTIME_SECRET:undefined}]){
  assert.throws(()=>issueGate({...configured,...change}),/STAGING_GATE_UNAVAILABLE/);
  assert.throws(()=>unlockGate('preview-phrase',{...configured,...change}),/STAGING_GATE_UNAVAILABLE/);
  assert.equal(verifyGate(cookie,{...configured,...change},now),false);
 }
});
test('all three journeys and four industries generate fixed fixtures; personal fields are refused',()=>{
 for(const kind of ['employer','talent','application'])for(const industry of ['warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work']){
  const input={kind,industry,cv:'none',requestId:randomUUID()},fixture=syntheticCase(input);
  assert.ok(parseIntake(fixture.kind,fixture.values,stageNotice).values);
  assert.equal(fixture.values.email,'synthetic@example.invalid');
  for(const extra of [{email:'real@example.com'},{name:'Actual person'},{bytes:'real upload'},{jobId:randomUUID()}])assert.throws(()=>syntheticCase({...input,...extra}),/INVALID_REQUEST/);
 }
 for(const input of [null,[],{}, {kind:'talent',industry:'other',cv:'none',requestId:randomUUID()}])assert.throws(()=>syntheticCase(input),/INVALID_REQUEST/);
});
test('staging storage refuses alternate locations, traversal and oversized reads before I/O',async()=>{
 assert.throws(()=>stageFileStore('/tmp'),/STAGING_STORAGE_INVALID/);const store=stageFileStore('/data/stage-files');
 await assert.rejects(()=>store.get('../../file',10),/INVALID_STORAGE_KEY/);
 await assert.rejects(()=>store.get('quarantine/'+randomUUID()+'/'+randomUUID()+'.pdf',5242881),/INVALID_FILE/);
});
