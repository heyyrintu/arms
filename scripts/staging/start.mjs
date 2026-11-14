import {stageConfig,stageRoleUrl,stageRoles} from '../../lib/staging/config.mjs';
const {secret}=stageConfig(process.env);
if(!process.env.APP_BASE_URL?.startsWith('https://'))throw new Error('STAGING_HTTPS_REQUIRED');
process.env.APP_BASE_URL=new URL(process.env.APP_BASE_URL).origin;
Object.assign(process.env,{
 STAFF_AUTH_ENABLED:'true',STAFF_DATABASE_URL:stageRoleUrl(stageRoles.auth),STAFF_AUTH_HMAC_SECRET:secret,
 SES_REGION:'ap-south-1',SES_FROM_EMAIL:'noreply@example.invalid',STAFF_DEV_SKIP_EMAIL_CODE:'false',
 JOBS_ENABLED:'false',JOBS_DATABASE_URL:stageRoleUrl(stageRoles.jobs),JOBS_PUBLIC_DATABASE_URL:stageRoleUrl(stageRoles.reader),
 INTAKE_REVIEW_ENABLED:'true',INTAKE_REVIEW_DATABASE_URL:stageRoleUrl(stageRoles.review),
 INTAKE_SUBMIT_DATABASE_URL:stageRoleUrl(stageRoles.submit),CV_PROCESSOR_DATABASE_URL:stageRoleUrl(stageRoles.processor),
 INTAKE_NOTIFIER_DATABASE_URL:stageRoleUrl(stageRoles.notifier),PRIVATE_CV_DOWNLOADS_ENABLED:'true',
 INTERNAL_NOTIFICATIONS_ENABLED:'false',CLAMAV_SOCKET_PATH:'/run/clamav/clamd.sock',HOSTNAME:'0.0.0.0',PORT:'3000'
});
await import('../../server.js');
