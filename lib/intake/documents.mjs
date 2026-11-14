import {createHash,randomUUID} from 'node:crypto';
import {isUuid} from './validation.mjs';
import {IntakeError} from './service.mjs';
export const maxCvBytes=5242880;
export function inspectPdf(file) {
 if(!file||typeof file.name!=='string'||!/^([^/\\\u0000-\u001f]{1,180})\.pdf$/i.test(file.name)||file.type!=='application/pdf'||!Buffer.isBuffer(file.bytes)||file.bytes.length<16||file.bytes.length>maxCvBytes) throw new IntakeError('INVALID_FILE');
 const bytes=Buffer.from(file.bytes);
 if(!/^%PDF-1\.[0-9]|^%PDF-2\.0/.test(bytes.subarray(0,8).toString('ascii'))||!bytes.subarray(-1024).toString('ascii').trimEnd().endsWith('%%EOF')) throw new IntakeError('INVALID_FILE');
 // Conservative additional rejection; a signature is not a malware scan.
 if(/\/(Encrypt|JavaScript|JS|Launch|EmbeddedFile|OpenAction)\b/.test(bytes.toString('latin1'))) throw new IntakeError('INVALID_FILE');
 return {bytes,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
// No public upload endpoint. The caller must independently authorize the parent
// and its consent. One CV per record; replacement requires a reviewed workflow.
export function documentProcessor({db,storage,scan,authorizeParent}) {
 return {
  async stage(recordId,file) {
   if(!isUuid(recordId)) throw new IntakeError('NOT_FOUND');
   const record=await authorizeParent(recordId);
   if(!record||record.kind==='employer') throw new IntakeError('FORBIDDEN');
   const checked=inspectPdf(file),id=randomUUID(),key=`quarantine/${recordId}/${id}.pdf`;
   // Metadata is saved first, so every potentially written object is tracked even
   // if put/scan fails or the process stops. Nothing pending is downloadable.
   try {await db.query('INSERT INTO arms_intake.documents(id,record_id,storage_key,sha256,size_bytes) VALUES($1,$2,$3,$4,$5)',[id,recordId,key,checked.sha256,checked.size]);}
   catch(error) {if(error.code==='23505')throw new IntakeError('DOCUMENT_EXISTS');throw error;}
   let status='failed';
   try {
    await storage.put(key,checked.bytes,checked.sha256);
    const verdict=await scan(checked.bytes);
    if(!['clean','rejected'].includes(verdict)) throw new Error('SCAN_UNAVAILABLE');
    status=verdict;
    const updated=await db.query('UPDATE arms_intake.documents SET scan_status=$2,scanned_at=clock_timestamp() WHERE id=$1 AND scan_status=\'pending\'',[id,status]);
    if(updated.rowCount!==1)throw new Error('SCAN_UNAVAILABLE');
   } catch {
    await db.query("UPDATE arms_intake.documents SET scan_status='failed',scanned_at=clock_timestamp() WHERE id=$1 AND scan_status='pending'",[id]);
    status='failed';
   }
   if(status!=='clean') {
    // Deletion is idempotent. Failed deletion stays visible in the cleanup queue.
    try {await storage.remove(key);await db.query('UPDATE arms_intake.documents SET object_deleted_at=clock_timestamp() WHERE id=$1',[id]);}catch { /* retry through cleanup */ }
   }
   return {documentId:id,status};
  },
  async cleanup(limit=50) {
   if(!Number.isInteger(limit)||limit<1||limit>50) throw new IntakeError('INVALID_REQUEST');
   const {rows}=await db.query(`WITH stale AS (SELECT id FROM arms_intake.documents WHERE scan_status<>'clean' AND object_deleted_at IS NULL AND created_at<clock_timestamp()-interval '1 hour' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1)
    UPDATE arms_intake.documents d SET scan_status=CASE WHEN scan_status='pending' THEN 'failed' ELSE scan_status END,scanned_at=coalesce(scanned_at,clock_timestamp()) FROM stale WHERE d.id=stale.id RETURNING d.id,d.storage_key`,[limit]);
   let removed=0,failed=0;
   for(const doc of rows) {
    try {await storage.remove(doc.storage_key);await db.query("UPDATE arms_intake.documents SET scan_status=CASE WHEN scan_status='pending' THEN 'failed' ELSE scan_status END,scanned_at=coalesce(scanned_at,clock_timestamp()),object_deleted_at=clock_timestamp() WHERE id=$1 AND scan_status<>'clean'",[doc.id]);removed++;}
    catch {failed++;}
   }
   return {removed,failed};
  },
 };
}
export function documentReview({db,storage,authorize,review}) {
 return {
  async list(recordId) {
   const actor=await authorize();if(!actor||actor.role!=='admin')throw new IntakeError('FORBIDDEN');
   await review.get(recordId);
   return (await db.query('SELECT id,scan_status,size_bytes,created_at FROM arms_intake.documents WHERE record_id=$1',[recordId])).rows;
  },
  async download(id) {
   const actor=await authorize();if(!actor||actor.role!=='admin'||!isUuid(actor.id))throw new IntakeError('FORBIDDEN');
   if(!isUuid(id)) throw new IntakeError('NOT_FOUND');
   const {rows:[doc]}=await db.query("SELECT * FROM arms_intake.documents WHERE id=$1 AND scan_status='clean' AND object_deleted_at IS NULL",[id]);
   if(!doc) throw new IntakeError('DOCUMENT_UNAVAILABLE');
   await review.get(doc.record_id);
   const bytes=await storage.get(doc.storage_key,doc.size_bytes);
   if(!Buffer.isBuffer(bytes)||bytes.length!==doc.size_bytes||createHash('sha256').update(bytes).digest('hex')!==doc.sha256) throw new IntakeError('DOCUMENT_UNAVAILABLE');
   // Recheck live authorization and retention after object retrieval. Only then
   // commit the document audit; failure releases no bytes to the HTTP response.
   const current=await authorize();if(!current||current.id!==actor.id||current.role!=='admin')throw new IntakeError('FORBIDDEN');
   await review.get(doc.record_id);
   await db.query('SELECT arms_intake.record_document_access($1,$2)',[id,actor.id]);
   return bytes;
  },
 };
}
