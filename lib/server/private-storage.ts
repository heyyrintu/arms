import 'server-only';
import {S3Client,HeadBucketCommand} from '@aws-sdk/client-s3';
import {privateBucketConfig} from './storage-config.mjs';
// Only a bounded readiness probe exists at this milestone. No upload/download
// endpoint is exposed before consent, scan/quarantine and record authorization.
export async function checkPrivateStorage() {
  const {bucket,...config}=privateBucketConfig(process.env);
  const s3=new S3Client({...config,maxAttempts:1});
  try {
    await s3.send(new HeadBucketCommand({Bucket:bucket}),{abortSignal:AbortSignal.timeout(5000)});
    return {authenticatedBucketAccess:true};
  } finally {s3.destroy();}
}
