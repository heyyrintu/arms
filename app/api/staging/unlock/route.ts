import {NextRequest,NextResponse} from 'next/server';
import {gateCookie,unlockGate,issueGate} from '@/lib/staging/gate.mjs';
export async function POST(request:NextRequest){
 const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
 if(process.env.ARMS_PRIVATE_STAGING!=='true')return NextResponse.json({error:'Unavailable'},{status:404,headers});
 if(request.headers.get('origin')!==process.env.APP_BASE_URL||request.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({error:'Request not allowed.'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0]!=='application/x-www-form-urlencoded')return NextResponse.json({error:'Invalid request.'},{status:415,headers});
 const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Invalid request.'},{status:400,headers});
 let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new Error();}chunks.push(value);}}catch{return NextResponse.json({error:'Request refused.'},{status:413,headers});}finally{reader.releaseLock();}
 const values=new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
 try {
 if([...values.keys()].some(key=>key!=='password')||values.getAll('password').length!==1||!unlockGate(values.get('password'),process.env))return NextResponse.json({error:'Access could not be verified.'},{status:401,headers});
 const output=NextResponse.redirect(new URL('/admin/staging',process.env.APP_BASE_URL),303);output.cookies.set(gateCookie,issueGate(process.env),{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:28800});return output;
 }catch{return NextResponse.json({error:'Private staging is unavailable.'},{status:503,headers});}
}
