import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {internalNotifications} from '../lib/intake/notifications.mjs';
const pg=new PGlite();
for(const file of ['002_staff_auth.sql','004_jobs.sql','008_intake.sql'])await pg.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
await pg.exec('CREATE ROLE arms_intake_notifier;');await pg.exec(await readFile(new URL('../database/011_internal_notifications.sql',import.meta.url),'utf8'));
const db={query:(...args)=>pg.query(...args)};
async function enqueue(){const id=randomUUID();await pg.query("INSERT INTO arms_intake.records(id,request_hash,payload_hash,kind,payload,notice_version,future_roles_opt_in,purpose_delete_after) VALUES($1,$2,$2,'talent',$3,'fixture',true,now()+interval '24 months')",[id,createHash('sha256').update(id).digest('hex'),JSON.stringify({name:'Synthetic',email:'',phone:'+919000000000',location:'Private'})]);await pg.query('INSERT INTO arms_intake.outbox(id,record_id) VALUES($1,$2)',[randomUUID(),id]);return id;}
after(()=>pg.close());
test('disabled worker touches no database; successful delivery sends minimal reference only',async()=>{
 await assert.rejects(()=>internalNotifications({db:{query(){throw new Error('TOUCHED');}},send:async()=>{}}).deliverOne(),/NOTIFICATIONS_UNAVAILABLE/);
 const id=await enqueue(),sent=[];
 await pg.exec('SET ROLE arms_intake_notifier');
 try {
  const worker=internalNotifications({db,enabled:true,send:async item=>{sent.push(item);}});
  assert.deepEqual(await worker.deliverOne(),{state:'sent'});assert.deepEqual(sent,[{referenceId:id,kind:'talent'}]);assert.deepEqual(await worker.deliverOne(),{state:'idle'});
  for(const sql of ['SELECT payload FROM arms_intake.records','SELECT * FROM arms_auth.staff_users','SELECT * FROM arms_intake.activity','DELETE FROM arms_intake.outbox'])await assert.rejects(()=>pg.exec(sql),/permission denied/);
 }finally{await pg.exec('RESET ROLE');}
});
test('send failure schedules bounded retries, active lease prevents another send, exhausted work stays failed',async()=>{
 const id=await enqueue(),worker=internalNotifications({db,enabled:true,send:async()=>{throw new Error('provider unavailable');}});
 assert.deepEqual(await worker.deliverOne(),{state:'retry_pending'});
 let row=(await pg.query('SELECT * FROM arms_intake.outbox WHERE record_id=$1',[id])).rows[0];assert.equal(row.state,'failed');assert.equal(row.sent_at,null);assert.equal(row.attempts,1);
 await pg.query("UPDATE arms_intake.outbox SET next_attempt_at=now()-interval '1 second',lease_until=now()+interval '1 minute' WHERE record_id=$1",[id]);assert.deepEqual(await worker.deliverOne(),{state:'idle'});
 await pg.query("UPDATE arms_intake.outbox SET lease_until=now()-interval '1 second',attempts=4 WHERE record_id=$1",[id]);assert.deepEqual(await worker.deliverOne(),{state:'exhausted'});assert.deepEqual(await worker.deliverOne(),{state:'idle'});
});
