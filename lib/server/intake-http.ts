import 'server-only';
import {NextRequest,NextResponse} from 'next/server';
import {staffConfiguration} from './staff';
import {authorizeIntake,getIntakeReview,getDocumentReview} from './intake';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
let activeDownloads=0;
export async function intakeMutation(request:NextRequest,id:string,download=false) {
 const config=staffConfiguration();
 if(!config.ready)return NextResponse.json({error:'Staff access is unavailable.'},{status:503,headers});
 if(request.headers.get('origin')!==config.origin||request.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({error:'Request not allowed.'},{status:403,headers});
 try {
  if(!await authorizeIntake())throw new Error('FORBIDDEN');
  if(download) {
   if(activeDownloads>=2)throw new Error('BUSY');
   activeDownloads++;
   try {
    const bytes=await(await getDocumentReview()).download(id);
    return new NextResponse(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="cv.pdf"','Content-Security-Policy':"sandbox; default-src 'none'",'Content-Length':String(bytes.length)}});
   } finally {activeDownloads--;}
  }
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return NextResponse.json({error:'Invalid request.'},{status:415,headers});
  const reader=request.body?.getReader();if(!reader)throw new Error('INVALID_REQUEST');
  const chunks:Uint8Array[]=[];let size=0;
  try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new Error('TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const row=await(await getIntakeReview()).changeStatus(id,input);
  return NextResponse.json({status:row.status,revision:row.revision},{headers});
 } catch(error) {
  const code=error instanceof Error?error.message:'';
  const status=code==='FORBIDDEN'?403:code==='NOT_FOUND'?404:code==='TOO_LARGE'?413:['CONFLICT','INVALID_TRANSITION','RETENTION_REVIEW_REQUIRED','DOCUMENT_UNAVAILABLE'].includes(code)?409:code==='INVALID_REQUEST'||error instanceof SyntaxError?422:503;
  const message=status===403?'Administrator access is required.':status===404?'This record could not be found.':status===413?'Request is too large.':status===409?'The record changed or is no longer available. Reload before continuing.':status===422?'Check the selected status.':'The request could not be confirmed. Please try again later.';
  return NextResponse.json({error:message},{status,headers});
 }
}
