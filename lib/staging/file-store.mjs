import {mkdir,writeFile,open,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join} from 'node:path';
// Private synthetic staging only. The production S3 adapter is unchanged.
export function stageFileStore(root) {
 if(root!=='/data/stage-files')throw new Error('STAGING_STORAGE_INVALID');
 const path=key=>{if(!/^quarantine\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/.test(key))throw new Error('INVALID_STORAGE_KEY');return join(root,key);};
 return {
  async put(key,bytes){const target=path(key);if(!Buffer.isBuffer(bytes)||bytes.length>5242880)throw new Error('INVALID_FILE');await mkdir(join(target,'..'),{recursive:true,mode:0o700});await writeFile(target,bytes,{flag:'wx',mode:0o600});},
  async get(key,size){if(!Number.isInteger(size)||size<1||size>5242880)throw new Error('INVALID_FILE');const file=await open(path(key),constants.O_RDONLY|constants.O_NOFOLLOW);try{const stat=await file.stat();if(!stat.isFile()||stat.size!==size)throw new Error('DOCUMENT_UNAVAILABLE');const bytes=Buffer.alloc(size);let offset=0;while(offset<size){const result=await file.read(bytes,offset,size-offset,offset);if(!result.bytesRead)throw new Error('DOCUMENT_UNAVAILABLE');offset+=result.bytesRead;}return bytes;}finally{await file.close();}},
  async remove(key){try{await unlink(path(key));}catch(error){if(error.code!=='ENOENT')throw error;}},
 };
}
