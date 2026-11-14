import 'server-only';
import {stageEnabled,stageConfig} from '@/lib/staging/config.mjs';
import {getLocale} from './locale';
import {translate} from '@/lib/i18n';
import {Pool} from 'pg';
import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';
import {databaseConfig} from '@/scripts/lib/database-config.mjs';
import {staffRuntimePermissionQuery} from '@/lib/auth/runtime-permissions.mjs';
import {staffAuth} from '@/lib/auth/service.mjs';
import {requiresEmailCode} from '@/lib/auth/crypto.mjs';

let pool: Pool | undefined;
let permissionCheck: Promise<void> | undefined;
export function staffConfiguration() {
  const enabled=process.env.STAFF_AUTH_ENABLED==='true';
  const requireEmail=requiresEmailCode(process.env.NODE_ENV,process.env.STAFF_DEV_SKIP_EMAIL_CODE);
  let origin='';
  try {
    const url=new URL(process.env.APP_BASE_URL ?? '');
    const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if (url.username || url.password || url.pathname!=='/' || url.search || url.hash ||
      (url.protocol!=='https:' && !(process.env.NODE_ENV==='development' && local && url.protocol==='http:'))) throw new Error();
    origin=url.origin;
  } catch { /* Invalid configuration keeps all auth endpoints unavailable. */ }
  const secret=process.env.STAFF_AUTH_HMAC_SECRET ?? '';
  const sender=process.env.SES_FROM_EMAIL ?? '';
  return {ready:enabled && !!process.env.STAFF_DATABASE_URL && !!origin && /^[A-Za-z0-9_-]{43,}$/.test(secret) &&
    (!requireEmail || (!!process.env.SES_REGION && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender))),origin,requireEmail,secret,sender};
}
export async function getStaffAuth() {
  const config=staffConfiguration();
  const locale=await getLocale();
  if (!config.ready) throw new Error('STAFF_AUTH_UNAVAILABLE');
  if (!pool) {
    pool=new Pool({...databaseConfig(process.env.STAFF_DATABASE_URL),max:4,application_name:'arms-staff-auth'});
    pool.on('error',()=>{});
  }
  permissionCheck ??= (async ()=>{
    const result=await pool!.query(staffRuntimePermissionQuery);
    if (Object.values(result.rows[0]).some(Boolean)) throw new Error('STAFF_RUNTIME_ROLE_UNSAFE');
  })().catch(error=>{permissionCheck=undefined;throw error;});
  await permissionCheck;
  const accessKeyId=process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey=process.env.SES_SECRET_ACCESS_KEY;
  if (!!accessKeyId!==!!secretAccessKey) throw new Error('SES_CREDENTIALS_INCOMPLETE');
  const ses=new SESv2Client({region:process.env.SES_REGION,maxAttempts:1,
    ...(accessKeyId&&secretAccessKey?{credentials:{accessKeyId,secretAccessKey}}:{})});
  return staffAuth({db:pool,secret:config.secret,requireEmail:config.requireEmail,sendCode:async (email:string,code:string)=>{
    if(stageEnabled(process.env)){stageConfig(process.env);const {captureStageCode}=await import('./staging');await captureStageCode(pool!,email,code);return;}
    const sent=await ses.send(new SendEmailCommand({FromEmailAddress:config.sender,Destination:{ToAddresses:[email]},
      Content:{Simple:{Subject:{Data:translate('Your ARMS staff sign-in code',locale),Charset:'UTF-8'},Body:{Text:{Charset:'UTF-8',Data:translate('Your ARMS Talent Partners staff sign-in code is {code}. It expires in 10 minutes. Do not share this code. If you did not request it, contact your administrator.',locale).replace('{code}',code)}}}}}),{abortSignal:AbortSignal.timeout(10000)});
    if (!sent.MessageId) throw new Error('EMAIL_NOT_ACCEPTED');
  }});
}
export const staffCookie=()=>process.env.NODE_ENV==='production'?'__Host-arms_staff':'arms_staff_dev';
export const challengeCookie=()=>process.env.NODE_ENV==='production'?'__Host-arms_challenge':'arms_challenge_dev';
export const cookieOptions=(maxAge:number)=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/',maxAge});
