import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {PGlite} from '@electric-sql/pglite';
import {documentProcessor,documentReview,inspectPdf,maxCvBytes} from '../lib/intake/documents.mjs';
import {parseScanReply} from '../lib/intake/clamav.mjs';
import {cvObjectStorage} from '../lib/intake/s3-storage.mjs';
const pg=new PGlite();
for(const file of ['002_staff_auth.sql','004_jobs.sql','008_intake.sql'])await pg.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
await pg.exec('CREATE ROLE arms_intake_submitter; CREATE ROLE arms_intake_reviewer; CREATE ROLE arms_cv_processor;');
for(const file of ['009_intake_grants.sql','010_private_documents.sql'])await pg.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
const actor={id:randomUUID(),role:'admin'};
await pg.query("INSERT INTO arms_auth.staff_users(id,login_id,email,password_hash,role) VALUES($1,'cv.fixture','cv@example.invalid','scrypt$131072$8$1$fixture','admin')",[actor.id]);
const db={query:(...args)=>pg.query(...args)};
const objects=new Map();
const storage={put:async(key,bytes)=>objects.set(key,Buffer.from(bytes)),get:async key=>objects.get(key),remove:async key=>{objects.delete(key);}};
const records=new Map();
const authorizeParent=async id=>{if(!records.has(id))throw new Error('FORBIDDEN');return records.get(id);};
const good=()=>({name:'synthetic.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-1.7\nSynthetic private fixture, not a real CV.\n%%EOF\n')});
async function record(){
 const id=randomUUID();await pg.query("INSERT INTO arms_intake.records(id,request_hash,payload_hash,kind,payload,notice_version,future_roles_opt_in,purpose_delete_after) VALUES($1,$2,$3,'talent',$4,'synthetic',true,now()+interval '24 months')",[id,createHash('sha256').update(id).digest('hex'),'a'.repeat(64),JSON.stringify({name:'Fixture',email:'',phone:'+919000000000',location:'Private'})]);
 records.set(id,{id,kind:'talent'});return id;
}
const review={get:authorizeParent};
const docs=documentReview({db,storage,authorize:async()=>actor,review});
after(()=>pg.close());
async function role(name,run){await pg.exec('SET ROLE '+name);try{return await run();}finally{await pg.exec('RESET ROLE');}}
test('file checks reject Office/path/type/size/signature and active/encrypted PDFs',()=>{
 const valid=inspectPdf(good());assert.equal(valid.size,good().bytes.length);
 for(const file of [{...good(),name:'x.docx'},{...good(),name:'../x.pdf'},{...good(),type:'text/plain'},{...good(),bytes:Buffer.alloc(maxCvBytes+1)},{...good(),bytes:Buffer.from('not a PDF at all')},{...good(),bytes:Buffer.from('%PDF-1.7\n/Encrypt foo\n%%EOF')},{...good(),bytes:Buffer.from('%PDF-1.7\n/JavaScript foo\n%%EOF')}])assert.throws(()=>inspectPdf(file),/INVALID_FILE/);
});
test('scanner accepts only explicit clean/infected responses; errors never become clean',()=>{
 assert.equal(parseScanReply('stream: OK\0'),'clean');assert.equal(parseScanReply('stream: Test.Signature FOUND\0'),'rejected');
 for(const reply of ['OK','stream: OK','stream: bad ERROR\0','stream: OK\0extra','stream: OK\n','INSTREAM size limit exceeded\0'])assert.throws(()=>parseScanReply(reply),/SCAN_UNAVAILABLE/);
});
test('quarantine tracks metadata before object write, hides original name and releases only scanned bytes',async()=>{
 const id=await record();let rowVisible=false;
 const processor=documentProcessor({db,authorizeParent,storage:{...storage,put:async(key,bytes)=>{rowVisible=(await pg.query('SELECT id FROM arms_intake.documents WHERE storage_key=$1',[key])).rows.length===1;await storage.put(key,bytes);}},scan:async()=> 'clean'});
 const result=await role('arms_cv_processor',()=>processor.stage(id,good()));assert.equal(rowVisible,true);assert.equal(result.status,'clean');
 const {rows:[doc]}=await pg.query('SELECT * FROM arms_intake.documents WHERE id=$1',[result.documentId]);assert.doesNotMatch(doc.storage_key,/synthetic/);assert.equal(doc.original_filename,undefined);
 const bytes=await role('arms_intake_reviewer',()=>docs.download(doc.id));assert.deepEqual(bytes,good().bytes);
 assert.equal((await pg.query('SELECT * FROM arms_intake.document_access WHERE document_id=$1',[doc.id])).rows.length,1);
 await assert.rejects(()=>processor.stage(id,good()),/DOCUMENT_EXISTS/);
});
test('infected or failed scans never download; rejected object is removed and deletion failures are tracked',async()=>{
 for(const verdict of ['rejected','error']){
  const id=await record();const processor=documentProcessor({db,storage,authorizeParent,scan:async()=>{if(verdict==='error')throw new Error('offline');return verdict;}});
  const result=await processor.stage(id,good());assert.equal(result.status,verdict==='error'?'failed':'rejected');
  const doc=(await pg.query('SELECT * FROM arms_intake.documents WHERE id=$1',[result.documentId])).rows[0];assert.ok(doc.object_deleted_at);assert.equal(objects.has(doc.storage_key),false);
  await assert.rejects(()=>docs.download(doc.id),/DOCUMENT_UNAVAILABLE/);
 }
 const id=await record();const result=await documentProcessor({db,authorizeParent,storage:{...storage,remove:async()=>{throw new Error('unavailable');}},scan:async()=> 'rejected'}).stage(id,good());
 const doc=(await pg.query('SELECT * FROM arms_intake.documents WHERE id=$1',[result.documentId])).rows[0];assert.equal(doc.object_deleted_at,null);
 await pg.query("UPDATE arms_intake.documents SET created_at=now()-interval '2 hours' WHERE id=$1",[doc.id]);
 const cleanup=await role('arms_cv_processor',()=>documentProcessor({db,storage,authorizeParent,scan:async()=> 'clean'}).cleanup());assert.ok(cleanup.removed>=1);assert.equal(objects.has(doc.storage_key),false);
});
test('anonymous/wrong role, missing parent, changed bytes, revoked session and audit failure release no document',async()=>{
 const id=await record(),result=await documentProcessor({db,storage,authorizeParent,scan:async()=> 'clean'}).stage(id,good());
 for(const actor of [null,{id:randomUUID(),role:'recruiter'}])await assert.rejects(()=>documentReview({db:{query(){throw new Error('TOUCHED');}},storage,authorize:async()=>actor,review}).download(result.documentId),/FORBIDDEN/);
 const denied=documentReview({db,storage,authorize:async()=>actor,review:{get:async()=>{throw new Error('RETENTION_REVIEW_REQUIRED');}}});await assert.rejects(()=>denied.download(result.documentId),/RETENTION_REVIEW_REQUIRED/);
 await assert.rejects(()=>documentReview({db,storage:{get:async()=>Buffer.from('changed')},authorize:async()=>actor,review}).download(result.documentId),/DOCUMENT_UNAVAILABLE/);
 let calls=0;await assert.rejects(()=>documentReview({db,storage,authorize:async()=>++calls===1?actor:null,review}).download(result.documentId),/FORBIDDEN/);
 await pg.exec("CREATE FUNCTION arms_intake.document_fail_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit offline'; END $$; CREATE TRIGGER fail_cv_access BEFORE INSERT ON arms_intake.document_access FOR EACH ROW EXECUTE FUNCTION arms_intake.document_fail_fixture();");
 await assert.rejects(()=>docs.download(result.documentId),/audit offline/);
 await pg.exec('DROP TRIGGER fail_cv_access ON arms_intake.document_access; DROP FUNCTION arms_intake.document_fail_fixture();');
 // DB independently denies document access after parent withdrawal.
 await pg.query("SELECT set_config('arms.intake_actor',$1,false)",[actor.id]);await pg.query("UPDATE arms_intake.records SET status='withdrawn',revision=revision+1 WHERE id=$1",[id]);
 await assert.rejects(()=>docs.download(result.documentId),/document not available/);
});
test('processor cannot read contacts/audit or change staff, reviewer cannot promote a scan result',async()=>{
 await role('arms_cv_processor',async()=>{for(const sql of ['SELECT payload FROM arms_intake.records','SELECT * FROM arms_auth.staff_users','DELETE FROM arms_intake.documents','INSERT INTO arms_intake.document_access(document_id,actor_id) VALUES(gen_random_uuid(),gen_random_uuid())'])await assert.rejects(()=>pg.exec(sql),/permission denied/);});
 await role('arms_intake_reviewer',async()=>{for(const sql of ["UPDATE arms_intake.documents SET scan_status='clean'",'DELETE FROM arms_intake.document_access'])await assert.rejects(()=>pg.exec(sql),/permission denied/);});
});
test('S3 adapter never sets public ACL, uses conditional random-key writes and bounded downloads',async()=>{
 const sent=[],key=`quarantine/${randomUUID()}/${randomUUID()}.pdf`,file=inspectPdf(good());
 const client={send:async command=>{sent.push(command);return command.constructor.name==='GetObjectCommand'?{ContentLength:file.size,ContentType:'application/pdf',Body:Readable.from([file.bytes])}:{};}};
 const store=cvObjectStorage({client,bucket:'private-test-bucket'});await store.put(key,file.bytes,file.sha256);assert.deepEqual(await store.get(key,file.size),file.bytes);await store.remove(key);
 assert.equal(sent[0].input.ACL,undefined);assert.equal(sent[0].input.IfNoneMatch,'*');assert.equal(sent[0].input.Metadata.sha256,file.sha256);
 await assert.rejects(()=>store.get('https://public.example.invalid/cv.pdf',file.size),/INVALID_STORAGE_KEY/);
 const tooLarge=cvObjectStorage({client:{send:async()=>({ContentLength:file.size,ContentType:'application/pdf',Body:Readable.from([Buffer.alloc(file.size+1)])})},bucket:'private-test-bucket'});
 await assert.rejects(()=>tooLarge.get(key,file.size),/DOCUMENT_UNAVAILABLE/);
});
test('cleanup never deletes a clean object or permits a late scan to re-promote a stale file',async()=>{
 const id=await record(),clean=await documentProcessor({db,storage,authorizeParent,scan:async()=> 'clean'}).stage(id,good());
 const doc=(await pg.query('SELECT * FROM arms_intake.documents WHERE id=$1',[clean.documentId])).rows[0];
 await pg.query("UPDATE arms_intake.documents SET created_at=now()-interval '2 hours' WHERE id=$1",[doc.id]);
 await documentProcessor({db,storage,authorizeParent,scan:async()=> 'clean'}).cleanup();assert.equal(objects.has(doc.storage_key),true);
 const other=await record();
 const processor=documentProcessor({db,storage,authorizeParent,scan:async()=>{
  await pg.query("UPDATE arms_intake.documents SET created_at=now()-interval '2 hours' WHERE record_id=$1",[other]);
  await documentProcessor({db,storage,authorizeParent,scan:async()=> 'clean'}).cleanup();return 'clean';
 }});
 const late=await processor.stage(other,good());assert.equal(late.status,'failed');
 await assert.rejects(()=>docs.download(late.documentId),/DOCUMENT_UNAVAILABLE/);
});
test('review runtime guard detects unsafe role memberships and column-level access',async()=>{
 const {reviewPermissionQuery,assertReviewPermissions}=await import('../lib/intake/review-permissions.mjs');
 await role('arms_intake_reviewer',async()=>{const safety=(await pg.query(reviewPermissionQuery)).rows[0];assert.doesNotThrow(()=>assertReviewPermissions(safety));});
 await pg.exec('GRANT UPDATE(payload) ON arms_intake.records TO arms_intake_reviewer');
 try{await role('arms_intake_reviewer',async()=>{const safety=(await pg.query(reviewPermissionQuery)).rows[0];assert.throws(()=>assertReviewPermissions(safety),/INTAKE_ROLE_UNSAFE/);});}finally{await pg.exec('REVOKE UPDATE(payload) ON arms_intake.records FROM arms_intake_reviewer');}
 await pg.exec('CREATE ROLE fixture_elevated CREATEROLE; GRANT fixture_elevated TO arms_intake_reviewer');
 try{await role('arms_intake_reviewer',async()=>{const safety=(await pg.query(reviewPermissionQuery)).rows[0];assert.equal(safety.elevated,true);assert.throws(()=>assertReviewPermissions(safety),/INTAKE_ROLE_UNSAFE/);});}finally{await pg.exec('REVOKE fixture_elevated FROM arms_intake_reviewer');}
});
