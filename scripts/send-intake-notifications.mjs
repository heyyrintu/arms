import {loadEnvFile} from 'node:process';
import {Pool} from 'pg';
import {SESv2Client,SendEmailCommand} from '@aws-sdk/client-sesv2';
import {databaseConfig} from './lib/database-config.mjs';
import {internalNotifications} from '../lib/intake/notifications.mjs';
try{loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw error;}
if(process.argv.length!==3||process.argv[2]!=='--send-internal'||process.env.INTERNAL_NOTIFICATIONS_ENABLED!=='true') {
 console.log('Disabled. Requires reviewed worker configuration and --send-internal. No connection or email attempted.');
} else {
 let db,ses;
 try {
  const recipient=process.env.INTAKE_NOTIFICATION_EMAIL,from=process.env.SES_FROM_EMAIL;
  if(![recipient,from].every(value=>typeof value==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))throw new Error('CONFIG');
  if(!process.env.INTAKE_NOTIFIER_DATABASE_URL||!process.env.SES_REGION)throw new Error('CONFIG');
  const accessKeyId=process.env.SES_ACCESS_KEY_ID,secretAccessKey=process.env.SES_SECRET_ACCESS_KEY;
  if(!!accessKeyId!==!!secretAccessKey)throw new Error('CONFIG');
  db=new Pool({...databaseConfig(process.env.INTAKE_NOTIFIER_DATABASE_URL),max:1,application_name:'arms-intake-notifications'});
  const {rows:[role]}=await db.query(`SELECT current_user AS name,
   EXISTS(SELECT 1 FROM pg_roles r WHERE pg_has_role(r.oid,'MEMBER') AND (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb)) AS elevated,
   has_schema_privilege('arms_intake','CREATE') AS can_create,
   has_column_privilege('arms_intake.records','payload','SELECT') AS pii,
   EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='arms_auth' AND (has_table_privilege(c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege(c.oid,'SELECT,INSERT,UPDATE'))) AS staff_access,
   has_table_privilege('arms_intake.outbox','DELETE,TRUNCATE') AS can_delete`);
  if(role.name!=='arms_intake_notifier'||Object.entries(role).some(([key,value])=>key!=='name'&&value))throw new Error('CONFIG');
  ses=new SESv2Client({region:process.env.SES_REGION,maxAttempts:1,...(accessKeyId?{credentials:{accessKeyId,secretAccessKey}}:{})});
  const worker=internalNotifications({db,enabled:true,send:async({referenceId,kind})=>{
   const result=await ses.send(new SendEmailCommand({FromEmailAddress:from,Destination:{ToAddresses:[recipient]},Content:{Simple:{Subject:{Charset:'UTF-8',Data:'ARMS: new submission for staff review'},Body:{Text:{Charset:'UTF-8',Data:`A ${kind} submission is ready for authorized staff review. Reference: ${referenceId}. Sign in through your approved staff workspace. This notification contains no applicant details.`}}}}}),{abortSignal:AbortSignal.timeout(10000)});
   if(!result.MessageId)throw new Error('EMAIL_UNCONFIRMED');
  }});
  // Bounded batch. A scheduler can repeat; no PII/addresses/provider errors logged.
  for(let count=0;count<10;count++){const result=await worker.deliverOne();console.log(result.state);if(result.state==='idle')break;}
 } catch {console.error('Notification worker unavailable. Check approved private configuration.');process.exitCode=1;}
 finally{ses?.destroy();await db?.end();}
}
