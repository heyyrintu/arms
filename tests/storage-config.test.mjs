import {test} from 'node:test';
import assert from 'node:assert/strict';
import {privateBucketConfig} from '../lib/server/storage-config.mjs';
const env={AWS_REGION:'ap-south-1',S3_PRIVATE_CV_BUCKET:'synthetic-private-bucket'};
test('private storage uses a bucket name and SDK-managed regional HTTPS endpoint',()=>{
  assert.deepEqual(privateBucketConfig(env),{region:'ap-south-1',bucket:'synthetic-private-bucket'});
  for(const value of ['https://synthetic.s3.ap-south-1.amazonaws.com','synthetic.s3.ap-south-1.amazonaws.com','../other','', 'BUCKET']) {
    assert.throws(()=>privateBucketConfig({...env,S3_PRIVATE_CV_BUCKET:value}));
  }
});
test('bucket credentials are isolated from SES and must be supplied as a complete pair',()=>{
  assert.throws(()=>privateBucketConfig({...env,LIGHTSAIL_BUCKET_ACCESS_KEY_ID:'synthetic-id'}));
  assert.deepEqual(privateBucketConfig({...env,SES_ACCESS_KEY_ID:'email-only'}),{region:'ap-south-1',bucket:'synthetic-private-bucket'});
  assert.equal(privateBucketConfig({...env,LIGHTSAIL_BUCKET_ACCESS_KEY_ID:'synthetic-id',LIGHTSAIL_BUCKET_SECRET_ACCESS_KEY:'synthetic-secret'}).credentials.accessKeyId,'synthetic-id');
});
