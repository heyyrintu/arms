import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const digest=async()=>{try{return createHash('sha256').update(await readFile('.env')).digest('hex');}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const run=script=>spawnSync(process.execPath,[script],{encoding:'utf8',timeout:10000,env:{...process.env,DATABASE_URL:'postgresql://synthetic:NEVER_PRINT_THIS_PASSWORD@127.0.0.1:1/unreachable'}});
test('fresh intake setup defaults to a no-network plan and never prints credentials or changes config',async()=>{
 const before=await digest(),result=run('scripts/setup-intake-database.mjs');
 assert.equal(result.status,0);const plan=JSON.parse(result.stdout);assert.equal(plan.applied,false);assert.equal(plan.publicCollection,false);assert.equal(plan.recordsCreated,0);assert.equal(plan.roles.length,4);assert.equal(plan.files.length,4);
 assert.doesNotMatch(result.stdout+result.stderr,/NEVER_PRINT_THIS_PASSWORD|SCRAM-SHA-256/);assert.equal(await digest(),before);
});
test('instance bucket check requires an explicit synthetic-roundtrip flag before starting SSH or uploads',()=>{
 const result=run('scripts/check-storage-instance.mjs');assert.equal(result.status,0);assert.match(result.stdout,/No action/);assert.doesNotMatch(result.stdout+result.stderr,/NEVER_PRINT_THIS_PASSWORD/);
});
test('hash-only migration plan never connects or changes configuration',async()=>{
 const before=await digest(),result=run('scripts/plan-intake-database.mjs');assert.equal(result.status,0);assert.match(result.stdout,/no connection or data changes/);assert.doesNotMatch(result.stdout+result.stderr,/NEVER_PRINT_THIS_PASSWORD/);assert.equal(await digest(),before);
});
