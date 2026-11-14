import nextEnv from '@next/env';
import {SESv2Client,SendEmailCommand} from '@aws-sdk/client-sesv2';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client;
try {
  if(!process.argv.includes('--simulator')) throw new Error('SIMULATOR_FLAG_REQUIRED');
  const region=process.env.SES_REGION, from=process.env.SES_FROM_EMAIL;
  const accessKeyId=process.env.SES_ACCESS_KEY_ID,secretAccessKey=process.env.SES_SECRET_ACCESS_KEY;
  if(!region||!from||!accessKeyId||!secretAccessKey) throw new Error('SES_CONFIGURATION_MISSING');
  client=new SESv2Client({region,credentials:{accessKeyId,secretAccessKey},maxAttempts:1});
  const result=await client.send(new SendEmailCommand({FromEmailAddress:from,
    Destination:{ToAddresses:['success@simulator.amazonses.com']},Content:{Simple:{
      Subject:{Data:'ARMS staff email configuration check',Charset:'UTF-8'},
      Body:{Text:{Data:'Synthetic AWS mailbox-simulator check. No staff account or sign-in code is created.',Charset:'UTF-8'}}
    }}}),{abortSignal:AbortSignal.timeout(10000)});
  if(!result.MessageId) throw new Error('SES_NOT_ACCEPTED');
  console.log(JSON.stringify({accepted:true,target:'AWS mailbox simulator',realRecipientContacted:false,staffAccountsCreated:0,staffSignInEnabled:process.env.STAFF_AUTH_ENABLED==='true'}));
} catch(error) {
  const allowed=['AccessDeniedException','MessageRejected','MailFromDomainNotVerifiedException','AccountSuspendedException','SendingPausedException','TooManyRequestsException','InvalidSignatureException','SignatureDoesNotMatch','InvalidClientTokenId','SES_CONFIGURATION_MISSING','SIMULATOR_FLAG_REQUIRED','SES_NOT_ACCEPTED','TimeoutError'];
  const candidate=error?.name==='Error'?error.message:error?.name;
  console.error(JSON.stringify({accepted:false,code:allowed.includes(candidate)?candidate:'SES_CHECK_FAILED',message:'SES check failed. No credential or raw provider error was displayed.'}));process.exitCode=1;
} finally {client?.destroy();}
