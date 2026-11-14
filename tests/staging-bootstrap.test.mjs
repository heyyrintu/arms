import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {bootstrapStage} from '../scripts/staging/bootstrap.mjs';
const env={ARMS_PRIVATE_STAGING:'true',STAGING_DATABASE_NAME:'arms_private_stage',STAGING_RUNTIME_SECRET:'x'.repeat(43),STAGING_BOOTSTRAP_PASSWORD:'y'.repeat(43),STAGING_ADMIN_PASSWORD:'z'.repeat(43)};
test('fresh staging bootstrap applies all actual migrations and creates only synthetic fixtures, repeat is safe',async()=>{
 const pg=new PGlite();
 const db={query:async(sql,params)=>params?pg.query(sql,params):(await pg.exec(sql)).at(-1)};
 try{
  await bootstrapStage(db,env);await bootstrapStage(db,env);
  const {rows}=await pg.query('SELECT login_id,email,role FROM arms_auth.staff_users');assert.deepEqual(rows,[{login_id:'qa@example.invalid',email:'qa@example.invalid',role:'admin'}]);
  const jobs=await pg.query('SELECT status,posting FROM arms_jobs.jobs');assert.equal(jobs.rows.length,1);assert.equal(jobs.rows[0].status,'published');assert.match(jobs.rows[0].posting.title,/SYNTHETIC/);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM arms_intake.records')).rows[0].n,0);
  await pg.exec('SET ROLE arms_intake_submitter');await assert.rejects(()=>pg.exec('SELECT email FROM arms_auth.staff_users'),/permission denied/);await pg.exec('RESET ROLE');
 }finally{await pg.close();}
});
