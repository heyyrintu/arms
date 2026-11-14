import {randomUUID} from 'node:crypto';
import {intakeKinds,isUuid} from './validation.mjs';
// Staff-only, minimal notifications. SES cannot guarantee exactly-once email:
// an uncertain send may be retried and duplicate the same reference notification.
export function internalNotifications({db,send,enabled=false}) {
 return {
  async deliverOne() {
   if(!enabled||typeof send!=='function')throw new Error('NOTIFICATIONS_UNAVAILABLE');
   const token=randomUUID();
   const {rows:[item]}=await db.query(`WITH picked AS (
    SELECT id FROM arms_intake.outbox WHERE state<>'sent' AND attempts<5 AND next_attempt_at<=clock_timestamp()
     AND (lease_until IS NULL OR lease_until<clock_timestamp()) ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
    UPDATE arms_intake.outbox o SET lease_token=$1,lease_until=clock_timestamp()+interval '2 minutes',attempts=attempts+1
    FROM picked WHERE o.id=picked.id RETURNING o.id,o.record_id,o.attempts`,[token]);
   if(!item)return {state:'idle'};
   try {
    const {rows:[record]}=await db.query('SELECT id,kind FROM arms_intake.records WHERE id=$1',[item.record_id]);
    if(!record||!isUuid(record.id)||!intakeKinds.includes(record.kind))throw new Error('INVALID_NOTIFICATION');
    await send({referenceId:record.id,kind:record.kind});
    const result=await db.query("UPDATE arms_intake.outbox SET state='sent',sent_at=clock_timestamp(),lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2",[item.id,token]);
    if(result.rowCount!==1)throw new Error('DELIVERY_UNCERTAIN');
    return {state:'sent'};
   } catch {
    await db.query("UPDATE arms_intake.outbox SET state='failed',next_attempt_at=clock_timestamp()+interval '15 minutes',lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2",[item.id,token]);
    return {state:item.attempts>=5?'exhausted':'retry_pending'};
   }
  },
 };
}
