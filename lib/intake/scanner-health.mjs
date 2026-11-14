import {createConnection} from 'node:net';
import {scanPdf} from './clamav.mjs';
export function signatureHealth(reply,{now=new Date(),maxAgeHours=48}={}) {
 const match=typeof reply==='string'&&/^ClamAV ([0-9]+\.[0-9]+\.[0-9]+)\/(\d{1,10})\/([A-Za-z]{3} [A-Za-z]{3}\s+\d{1,2} \d{2}:\d{2}:\d{2} \d{4})\0$/.exec(reply);
 if(!match||!Number.isInteger(maxAgeHours)||maxAgeHours<1||maxAgeHours>48)throw new Error('SCAN_NOT_READY');
 const built=new Date(match[3]+' UTC'),age=new Date(now).getTime()-built.getTime();
 if(!Number.isFinite(age)||age< -300000||age>maxAgeHours*3600000)throw new Error('SCAN_NOT_READY');
 const version=match[1].split('.').map(Number);
 if(version[0]<1||(version[0]===1&&version[1]<5)||(version[0]===1&&version[1]===5&&version[2]<4))throw new Error('SCAN_NOT_READY');
 return {engine:match[1],signatureVersion:Number(match[2]),builtAt:built.toISOString(),fresh:true};
}
export async function scannerCommand(command,{socketPath,timeoutMs=3000}={}) {
 if(!['PING','VERSION'].includes(command)||typeof socketPath!=='string'||!socketPath.startsWith('/')||socketPath.length>100||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw new Error('SCAN_NOT_READY');
 const socket=createConnection({path:socketPath});let timer;
 try{return await new Promise((resolve,reject)=>{
  let done=false,bytes=Buffer.alloc(0);
  const finish=(value)=>{if(done)return;done=true;if(value===null)reject(new Error('SCAN_NOT_READY'));else resolve(value);socket.destroy();};
  timer=setTimeout(()=>finish(null),timeoutMs);
  socket.on('connect',()=>socket.write('z'+command+'\0'));
  socket.on('error',()=>finish(null));socket.on('end',()=>{if(!done)finish(null);});
  socket.on('data',chunk=>{bytes=Buffer.concat([bytes,chunk]);if(bytes.length>1024)return finish(null);if(bytes.includes(0))finish(bytes.toString('utf8'));});
 });}finally{clearTimeout(timer);socket.destroy();}
}
// Use this wrapper in the future real worker, so stale running engines fail
// closed even when the last successful daemon startup was days earlier.
export async function scanCurrentPdf(bytes,options) {
 if(await scannerCommand('PING',options)!=='PONG\0')throw new Error('SCAN_NOT_READY');
 signatureHealth(await scannerCommand('VERSION',options));
 return scanPdf(bytes,options);
}
