import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scanPdf} from '../lib/intake/clamav.mjs';
async function socketFixture(run,reply){
 const folder=await mkdtemp(join(tmpdir(),'arms-clam-')),path=join(folder,'scan.sock');let received=Buffer.alloc(0);const peers=new Set();
 const server=createServer(socket=>{peers.add(socket);socket.on('close',()=>peers.delete(socket));socket.on('error',()=>{});socket.on('data',chunk=>{received=Buffer.concat([received,chunk]);if(received.length>=24&&received.subarray(-4).equals(Buffer.alloc(4))&&reply!==null){socket.write(reply.slice(0,4));setTimeout(()=>socket.end(reply.slice(4)),2);}});});
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(path,resolve);});await run(path,()=>received);}
 finally{for(const peer of peers)peer.destroy();await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true});}
}
test('ClamAV Unix adapter sends framed bytes and handles fragmented responses',async()=>{
 const bytes=Buffer.from('Synthetic test file');
 await socketFixture(async(path,received)=>{
  assert.equal(await scanPdf(bytes,{socketPath:path}),'clean');const data=received();assert.equal(data.subarray(0,10).toString(),'zINSTREAM\0');assert.equal(data.readUInt32BE(10),bytes.length);assert.deepEqual(data.subarray(14,-4),bytes);
 },'stream: OK\0');
});
test('ClamAV timeout/error never accepts a file',async()=>{
 await socketFixture(async path=>{await assert.rejects(()=>scanPdf(Buffer.from('Synthetic test file'),{socketPath:path,timeoutMs:30}),/SCAN_UNAVAILABLE/);},null);
 await socketFixture(async path=>{await assert.rejects(()=>scanPdf(Buffer.from('Synthetic test file'),{socketPath:path}),/SCAN_UNAVAILABLE/);},'stream: broken ERROR\0');
 await assert.rejects(()=>scanPdf(Buffer.from('Synthetic test file'),{socketPath:'https://untrusted.invalid'}),/SCAN_UNAVAILABLE/);
});
test('signature freshness rejects stale, future, malformed or unapproved engines',async()=>{
 const {signatureHealth}=await import('../lib/intake/scanner-health.mjs');
 const now=new Date('2026-11-15T00:00:00Z');
 assert.equal(signatureHealth('ClamAV 1.5.4/28183/Sat Nov 14 06:24:17 2026\0',{now}).fresh,true);
 for(const reply of ['ClamAV 1.5.4/28177/Sun Nov  8 06:23:52 2026\0','ClamAV 1.5.4/28199/Tue Nov 17 06:24:17 2026\0','ClamAV 1.4.1/28183/Sat Nov 14 06:24:17 2026\0','stream: OK\0','ClamAV 1.5.4/28183/Sat Nov 14 06:24:17 2026'])assert.throws(()=>signatureHealth(reply,{now}),/SCAN_NOT_READY/);
 assert.throws(()=>signatureHealth('ClamAV 1.5.4/28183/Sat Nov 14 06:24:17 2026\0',{now,maxAgeHours:49}),/SCAN_NOT_READY/);
});
test('scanner health commands are bounded and cannot send mutation commands',async()=>{
 const {scannerCommand}=await import('../lib/intake/scanner-health.mjs');
 await assert.rejects(()=>scannerCommand('SHUTDOWN',{socketPath:'/tmp/example.sock'}),/SCAN_NOT_READY/);
 const folder=await mkdtemp(join(tmpdir(),'arms-health-')),path=join(folder,'scan.sock');
 const server=createServer(socket=>socket.once('data',bytes=>{assert.equal(bytes.toString(),'zPING\0');socket.end('PONG\0');}));
 try {await new Promise(resolve=>server.listen(path,resolve));assert.equal(await scannerCommand('PING',{socketPath:path}),'PONG\0');}
 finally {await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true});}
});
