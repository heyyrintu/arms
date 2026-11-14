import {createHmac} from 'node:crypto';
export const stageActorId='10000000-0000-4000-8000-000000000001';
export const stageJobId='20000000-0000-4000-8000-000000000001';
export const stageEmail='qa@example.invalid';
export const stageNotice='PRIVATE-SYNTHETIC-STAGING-v1';
export const stageRoles={auth:'arms_staff_runtime',jobs:'arms_jobs_runtime',reader:'arms_jobs_reader',submit:'arms_intake_submitter',review:'arms_intake_reviewer',processor:'arms_cv_processor',notifier:'arms_intake_notifier',capture:'arms_stage_runtime'};
export function stageEnabled(env=process.env){return env.ARMS_PRIVATE_STAGING==='true';}
export function stageConfig(env=process.env) {
 if(!stageEnabled(env)||env.STAGING_DATABASE_NAME!=='arms_private_stage'||typeof env.STAGING_RUNTIME_SECRET!=='string'||env.STAGING_RUNTIME_SECRET.length<43)throw new Error('STAGING_UNAVAILABLE');
 if(['DATABASE_URL','SES_ACCESS_KEY_ID','SES_SECRET_ACCESS_KEY','LIGHTSAIL_BUCKET_ACCESS_KEY_ID','LIGHTSAIL_BUCKET_SECRET_ACCESS_KEY'].some(key=>env[key]))throw new Error('STAGING_REAL_CREDENTIALS_REFUSED');
 return {name:'arms_private_stage',secret:env.STAGING_RUNTIME_SECRET};
}
export function stageRolePassword(role,env=process.env) {
 const config=stageConfig(env);if(!Object.values(stageRoles).includes(role))throw new Error('STAGING_ROLE_INVALID');
 return createHmac('sha256',config.secret).update('staging-role:'+role).digest('base64url');
}
export function stageRoleUrl(role,env=process.env) {
 const config=stageConfig(env),url=new URL('postgresql://127.0.0.1:5432/'+config.name);
 url.username=role;url.password=stageRolePassword(role,env);url.searchParams.set('sslmode','disable');return url.toString();
}
