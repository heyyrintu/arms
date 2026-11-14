import nextEnv from '@next/env';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
import {privateBucketConfig} from '../lib/server/storage-config.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
if(!process.argv.includes('--synthetic-roundtrip')){console.log('No action. Pass --synthetic-roundtrip for the approved private bucket check.');process.exit(0);}
const {bucket,region}=privateBucketConfig(process.env);
const url=new URL(process.env.DATABASE_URL),user=process.env.DATABASE_SSH_USER||'ubuntu';
if(!/^[a-z_][a-z0-9_-]*$/.test(user))throw new Error('Invalid SSH user');
const source=(await readFile(new URL('../lib/intake/s3-storage.mjs',import.meta.url),'utf8'))
 .replace("import {PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';", "const {PutObjectCommand,GetObjectCommand,DeleteObjectCommand}=require('@aws-sdk/client-s3');")
 .replace("import {maxCvBytes} from './documents.mjs';",'const maxCvBytes=5242880;').replace('export function cvObjectStorage','function cvObjectStorage');
const probe=`const {S3Client,HeadBucketCommand,HeadObjectCommand,GetObjectAclCommand,ListObjectVersionsCommand}=require('@aws-sdk/client-s3');
const {randomUUID,createHash}=require('node:crypto');
${source}
(async()=>{
const bucket=process.env.S3_PRIVATE_CV_BUCKET,region=process.env.AWS_REGION,s3=new S3Client({region,maxAttempts:1});
const key='quarantine/'+randomUUID()+'/'+randomUUID()+'.pdf',bytes=Buffer.from('%PDF-1.7\\nARMS SYNTHETIC STORAGE CHECK. No applicant or personal data.\\n%%EOF\\n'),digest=createHash('sha256').update(bytes).digest('hex');
const versions=[];let attempted=false,deleted=false;const report={instanceCredentials:true,syntheticOnly:true};
const client={send:async(command,options)=>{const output=await s3.send(command,options);if(['PutObjectCommand','DeleteObjectCommand'].includes(command.constructor.name)&&output.VersionId)versions.push(output.VersionId);return output;}};
const store=cvObjectStorage({client,bucket});
try {
 await s3.send(new HeadBucketCommand({Bucket:bucket}),{abortSignal:AbortSignal.timeout(10000)});report.authenticatedBucketAccess=true;
 attempted=true;await store.put(key,bytes,digest);report.conditionalPut=true;
 try{await store.put(key,bytes,digest);report.overwriteBlocked=false;}catch(error){report.overwriteBlocked=error.$metadata?.httpStatusCode===412;}
 const downloaded=await store.get(key,bytes.length);report.roundtripIntegrity=createHash('sha256').update(downloaded).digest('hex')===digest;
 const head=await s3.send(new HeadObjectCommand({Bucket:bucket,Key:key}));report.encryption=head.ServerSideEncryption||'not-reported';report.versioned=!!head.VersionId;
 try{const acl=await s3.send(new GetObjectAclCommand({Bucket:bucket,Key:key}));report.publicAclAbsent=!(acl.Grants||[]).some(grant=>grant.Grantee?.URI?.includes('AllUsers')||grant.Grantee?.URI?.includes('AuthenticatedUsers'));}catch{report.publicAclAbsent='unverified';}
 const anonymous=await fetch('https://'+bucket+'.s3.'+region+'.amazonaws.com/'+key,{redirect:'error',signal:AbortSignal.timeout(10000)});report.anonymousReadStatus=anonymous.status;await anonymous.body?.cancel();
 await store.remove(key);report.deleteAccepted=true;
 try{await s3.send(new HeadObjectCommand({Bucket:bucket,Key:key}));report.currentObjectGone=false;}catch(error){report.currentObjectGone=[403,404].includes(error.$metadata?.httpStatusCode);}
} catch(error){report.errorCode=/^[A-Za-z0-9_]{1,60}$/.test(error.name||'')?error.name:'CHECK_FAILED';process.exitCode=1;}
finally{
 if(attempted){
  try{
   // Restrict cleanup to the single new random key; never touch another object.
   for(const version of new Set(versions))await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key,VersionId:version}));
   const listed=await s3.send(new ListObjectVersionsCommand({Bucket:bucket,Prefix:key,MaxKeys:20}));
   const remaining=[...(listed.Versions||[]),...(listed.DeleteMarkers||[])].filter(item=>item.Key===key);
   for(const item of remaining)await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key,VersionId:item.VersionId}));
   if(listed.IsTruncated)throw new Error('CLEANUP_UNCONFIRMED');
   deleted=true;
  }catch{try{await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));}catch{}report.cleanup='current-key removal attempted; historical versions unverified';}
 }
 if(deleted)report.cleanup='synthetic key and versions removed';
 s3.destroy();
 const success=report.authenticatedBucketAccess&&report.overwriteBlocked&&report.roundtripIntegrity&&report.anonymousReadStatus===403&&report.currentObjectGone&&report.publicAclAbsent===true&&['AES256','aws:kms'].includes(report.encryption)&&deleted;
 report.passed=!!success;if(!success)process.exitCode=1;
 // Key is non-sensitive and only reported if needed to remove our test artifact.
 if(attempted&&!deleted)report.syntheticCleanupKey=key;
 console.log(JSON.stringify(report));
}
})().catch(()=>{console.error('Synthetic storage check unavailable.');process.exitCode=1;});`;
const key=process.env.DATABASE_SSH_KEY_PATH||homedir()+'/.ssh/arms-lightsail-ap-south-1.pem';
const command=`sudo -n docker run --rm -i --read-only --tmpfs /tmp:rw,nosuid,size=128m --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 --cpus .5 --memory 384m --user 1000:1000 --network host -e AWS_REGION=${region} -e S3_PRIVATE_CV_BUCKET=${bucket} --entrypoint sh node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a -c 'npm install --cache /tmp/npm-cache --prefix /tmp/arms-probe --ignore-scripts --no-audit --no-fund --loglevel error @aws-sdk/client-s3@3.1169.0 >/dev/null && NODE_PATH=/tmp/arms-probe/node_modules node -'`;
const child=spawn('ssh',['-F','/dev/null','-T','-i',key,'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','--',user+'@'+url.hostname,command],{stdio:['pipe','inherit','inherit']});
child.stdin.end(probe);child.stdin.on('error',()=>{});
const timeout=setTimeout(()=>{child.kill('SIGTERM');},180000);
child.on('error',()=>{console.error('Instance storage probe unavailable.');process.exitCode=1;});
child.on('exit',code=>{clearTimeout(timeout);process.exitCode=code??1;});
