import 'server-only';
import {NextRequest,NextResponse} from 'next/server';
import {getJobsService} from './jobs';
import {staffConfiguration} from './staff';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
export async function jobMutation(request:NextRequest,id:string) {
  const config=staffConfiguration();
  if(!config.ready) return NextResponse.json({error:'Staff sign-in is not configured yet.'},{status:503,headers});
  if(request.headers.get('origin')!==config.origin || request.headers.get('sec-fetch-site')==='cross-site') return NextResponse.json({error:'Request not allowed.'},{status:403,headers});
  try {
    const service=await getJobsService();
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return NextResponse.json({error:'Send job details as JSON.'},{status:415,headers});
    const reader=request.body?.getReader();if(!reader) throw new Error('INVALID_REQUEST');
    let size=0;const parts:Uint8Array[]=[];
    try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw new Error('TOO_LARGE');}parts.push(value);}}finally{reader.releaseLock();}
    const input=JSON.parse(Buffer.concat(parts).toString('utf8'));
    const job=await service.mutate(id,input);
    return NextResponse.json({job},{headers});
  } catch(error) {
    const code=error instanceof Error?error.message:'';
    const status=code==='FORBIDDEN'?403:code==='NOT_FOUND'?404:code==='TOO_LARGE'?413:code==='RATE_LIMITED'?429:
      ['CONFLICT','SLUG_CONFLICT','INVALID_TRANSITION'].includes(code)?409:['VALIDATION','APPROVAL_REQUIRED','INVALID_REQUEST'].includes(code)||error instanceof SyntaxError?422:503;
    const messages:Record<string,string>={FORBIDDEN:'Administrator access is required.',NOT_FOUND:'This job could not be found.',TOO_LARGE:'Job details are too large.',RATE_LIMITED:'Too many changes. Wait a minute before trying again.',CONFLICT:'This posting changed elsewhere, or a previous request completed. Reload the saved posting before continuing.',SLUG_CONFLICT:'That job URL is already in use. Choose another slug.',INVALID_TRANSITION:'This job status changed. Reload before continuing.',VALIDATION:'Check the highlighted job details.',APPROVAL_REQUIRED:'Preview the saved revision and confirm the genuine vacancy authorization before publishing.',INVALID_REQUEST:'Invalid job request.'};
    const fields=code==='VALIDATION'&&error&&typeof error==='object'&&'fields' in error?error.fields:{};
    return NextResponse.json({error:messages[code]??'Job storage is temporarily unavailable. Your changes have not been confirmed.',fields},{status,headers:{...headers,...(status===429?{'Retry-After':'60'}:{})}});
  }
}
