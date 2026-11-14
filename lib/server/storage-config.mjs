export function privateBucketConfig(env) {
  const region=env.AWS_REGION;
  const bucket=env.S3_PRIVATE_CV_BUCKET;
  if (typeof region!=='string' || !/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(region)) throw new Error('STORAGE_REGION_INVALID');
  if (typeof bucket!=='string' || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('STORAGE_BUCKET_NAME_REQUIRED');
  const id=env.LIGHTSAIL_BUCKET_ACCESS_KEY_ID, key=env.LIGHTSAIL_BUCKET_SECRET_ACCESS_KEY;
  if (!!id!==!!key) throw new Error('STORAGE_CREDENTIALS_INCOMPLETE');
  return {bucket,region,...(id&&key?{credentials:{accessKeyId:id,secretAccessKey:key}}:{})};
}
