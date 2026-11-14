import {NextRequest,NextResponse} from 'next/server';
import {authorizeIntake} from '@/lib/server/intake';
import {runStageCase} from '@/lib/server/staging';
export async function POST(request:NextRequest){
 const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
 if(process.env.ARMS_PRIVATE_STAGING!=='true')return NextResponse.json({error:'Unavailable.'},{status:404,headers});
 if(request.headers.get('origin')!==process.env.APP_BASE_URL||request.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({error:'Request not allowed.'},{status:403,headers});
 try {
  if(!await authorizeIntake())return NextResponse.json({error:'Administrator access is required.'},{status:403,headers});
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return NextResponse.json({error:'Invalid request.'},{status:415,headers});
  const reader=request.body?.getReader();if(!reader)throw new Error('INVALID_REQUEST');let size=0;const parts:Uint8Array[]=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new Error('INVALID_REQUEST');}parts.push(value);}}finally{reader.releaseLock();}
  const input=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_REQUEST');
  return NextResponse.json(await runStageCase(input),{headers});
 }catch(error){const code=error instanceof Error?error.message:'';return NextResponse.json({error:code==='RATE_LIMITED'?'Private test budget reached. Try again later.':code==='CONFLICT'?'This test reference already has different details. Change the case and retry.':'The synthetic test could not be confirmed. No real-data submission is enabled.'},{status:code==='RATE_LIMITED'?429:code==='CONFLICT'?409:503,headers});}
}
