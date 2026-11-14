import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(process.argv.length>2) {
 console.error('Plan only. Use the reviewed fresh-setup tool for initial application; it refuses existing resources.');
 process.exitCode=1;
} else {
 console.log('Intake migration source hashes; this command makes no connection or data changes.');
 for(const name of ['008_intake.sql','009_intake_grants.sql','010_private_documents.sql','011_internal_notifications.sql']) {
  const sql=await readFile(new URL('../database/'+name,import.meta.url));
  console.log(name,createHash('sha256').update(sql).digest('hex'));
 }
 console.log('Requires reviewed private staging, separate restricted logins, approved privacy and operational safeguards before collection.');
}
