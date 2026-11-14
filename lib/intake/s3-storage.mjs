import {PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {maxCvBytes} from './documents.mjs';
const validKey=key=>typeof key==='string'&&/^quarantine\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/.test(key);
export function cvObjectStorage({client,bucket}) {
 function check(key){if(!validKey(key))throw new Error('INVALID_STORAGE_KEY');}
 return {
  async put(key,bytes,sha256) {
   check(key);
   if(!Buffer.isBuffer(bytes)||bytes.length>maxCvBytes||!/^[0-9a-f]{64}$/.test(sha256))throw new Error('INVALID_FILE');
   await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentLength:bytes.length,ContentType:'application/pdf',IfNoneMatch:'*',ChecksumSHA256:Buffer.from(sha256,'hex').toString('base64'),Metadata:{sha256}}),{abortSignal:AbortSignal.timeout(15000)});
  },
  async get(key,size) {
   check(key);if(!Number.isInteger(size)||size<1||size>maxCvBytes)throw new Error('INVALID_FILE');
   const output=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}),{abortSignal:AbortSignal.timeout(15000)});
   const body=output.Body;
   if(!body||output.ContentLength!==size||output.ContentType!=='application/pdf'){body?.destroy?.();throw new Error('DOCUMENT_UNAVAILABLE');}
   const chunks=[];let received=0;
   try {for await(const chunk of body){received+=chunk.length;if(received>size)throw new Error('DOCUMENT_UNAVAILABLE');chunks.push(chunk);}}
   finally{body.destroy?.();}
   if(received!==size)throw new Error('DOCUMENT_UNAVAILABLE');
   return Buffer.concat(chunks);
  },
  async remove(key) {
   check(key);await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}),{abortSignal:AbortSignal.timeout(10000)});
  },
 };
}
