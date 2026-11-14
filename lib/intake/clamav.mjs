import {createConnection} from 'node:net';
import {once} from 'node:events';
export function parseScanReply(reply) {
 if(reply==='stream: OK\0') return 'clean';
 if(/^stream: [^\r\n\0]{1,500} FOUND\0$/.test(reply)) return 'rejected';
 throw new Error('SCAN_UNAVAILABLE');
}
// Unix socket only: clamd TCP has no transport authentication. Never send paths
// or filenames to the scanner, and never log its potentially sensitive response.
export async function scanPdf(bytes,{socketPath,timeoutMs=15000}={}) {
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>5242880||typeof socketPath!=='string'||!socketPath.startsWith('/')||socketPath.length>100||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000) throw new Error('SCAN_UNAVAILABLE');
 const socket=createConnection({path:socketPath}),controller=new AbortController();
 let timer;
 try {
  return await new Promise((resolve,reject)=>{
   let reply=Buffer.alloc(0),settled=false;
   const finish=(error,result)=>{if(settled)return;settled=true;if(error)reject(new Error('SCAN_UNAVAILABLE'));else resolve(result);controller.abort();socket.destroy();};
   timer=setTimeout(()=>finish(true),timeoutMs);
   socket.on('error',()=>finish(true));
   socket.on('end',()=>{if(!settled)finish(true);});
   socket.on('data',chunk=>{
    reply=Buffer.concat([reply,chunk]);
    if(reply.length>1024) return finish(true);
    if(reply.includes(0)) {try{finish(false,parseScanReply(reply.toString('utf8')));}catch{finish(true);}}
   });
   socket.on('connect',async()=>{
    try {
     socket.write('zINSTREAM\0');
     for(let offset=0;offset<bytes.length;offset+=65536) {
      const chunk=bytes.subarray(offset,offset+65536),header=Buffer.alloc(4);header.writeUInt32BE(chunk.length);
      if(!socket.write(Buffer.concat([header,chunk]))) await once(socket,'drain',{signal:controller.signal});
     }
     socket.write(Buffer.alloc(4));
    } catch {finish(true);}
   });
  });
 } finally {clearTimeout(timer);controller.abort();socket.destroy();}
}
