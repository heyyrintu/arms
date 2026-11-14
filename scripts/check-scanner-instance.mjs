import nextEnv from '@next/env';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
if(process.argv[2]!=='--synthetic'||process.argv.length!==3){console.log('No action. Pass --synthetic for private engine checks with harmless test bytes.');process.exit(0);}
let source=await readFile(new URL('../lib/intake/clamav.mjs',import.meta.url),'utf8');
source+='\n'+(await readFile(new URL('../lib/intake/scanner-health.mjs',import.meta.url),'utf8')).replace("import {createConnection} from 'node:net';",'').replace("import {scanPdf} from './clamav.mjs';",'');
const probe=source+`
import assert from 'node:assert/strict';
const options={socketPath:'/run/clamav/clamd.sock',timeoutMs:3000};
try{
 const health=signatureHealth(await scannerCommand('VERSION',options));
 assert.equal(await scannerCommand('PING',options),'PONG\\0');
 const benign=Buffer.from('%PDF-1.7\\nPrivate synthetic scanner check. No personal data.\\n%%EOF\\n');
 assert.equal(await scanCurrentPdf(benign,options),'clean');
 // EICAR is a standard harmless antivirus test string, never a real CV.
 const eicar=Buffer.from(['X5O!P%@AP[4','\\\\PZX54(P^)7CC)7}$EICAR-','STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'].join(''));
 assert.equal(await scanCurrentPdf(eicar,options),'rejected');
 let bounded=false;try{await scanCurrentPdf(Buffer.alloc(5242881),options);}catch{bounded=true;}assert.equal(bounded,true);
 let unavailable=false;try{await scanCurrentPdf(benign,{socketPath:'/run/clamav/not-present.sock',timeoutMs:100});}catch{unavailable=true;}assert.equal(unavailable,true);
 console.log(JSON.stringify({privateSocket:true,...health,benignAccepted:true,harmlessAntivirusTestRejected:true,oversizedRejected:true,missingSocketRejected:true,realApplicantData:false}));
}catch{console.error('Scanner checks failed; do not enable CV processing.');process.exitCode=1;}
`;
const url=new URL(process.env.DATABASE_URL),user=process.env.DATABASE_SSH_USER||'ubuntu';if(!/^[a-z_][a-z0-9_-]*$/.test(user))throw new Error('Invalid SSH identity');
const command="sudo -n docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges --user 1000:1000 --group-add 101 --memory 128m --memory-swap 128m --cpus .5 --pids-limit 32 --mount source=arms-private-clamav-run,target=/run/clamav --entrypoint node node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a --input-type=module -";
const child=spawn('ssh',['-F','/dev/null','-T','-i',process.env.DATABASE_SSH_KEY_PATH||homedir()+'/.ssh/arms-lightsail-ap-south-1.pem','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','--',user+'@'+url.hostname,command],{stdio:['pipe','inherit','inherit']});child.stdin.end(probe);child.stdin.on('error',()=>{});child.on('exit',code=>process.exitCode=code??1);child.on('error',()=>{console.error('Scanner check unavailable.');process.exitCode=1;});
