import nextEnv from '@next/env';
import {S3Client,HeadBucketCommand} from '@aws-sdk/client-s3';
import {privateBucketConfig} from '../lib/server/storage-config.mjs';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client;
try {
  const {bucket,...config}=privateBucketConfig(process.env);
  client=new S3Client({...config,maxAttempts:1});
  await client.send(new HeadBucketCommand({Bucket:bucket}),{abortSignal:AbortSignal.timeout(5000)});
  console.log(JSON.stringify({authenticatedBucketAccess:true,readOnly:true,objectsRead:0,objectsWritten:0,privacyVerified:false,message:'Authenticated reachability only; confirm All objects are private in Lightsail.'}));
} catch {
  console.error(JSON.stringify({authenticatedBucketAccess:false,readOnly:true,message:'Storage verification failed. Check bucket name, region and instance resource access or dedicated bucket credentials. No object was uploaded or read.'}));
  process.exitCode=1;
} finally {client?.destroy();}
