import {NextRequest,NextResponse} from 'next/server';
export async function POST(request:NextRequest) {
  const headers={'Cache-Control':'no-store'};
  // Next's local URL may normalize 127.0.0.1 to localhost. Match the browser's
  // actual request Host, without trusting a forwarded host or arbitrary origin.
  let origin:URL;
  try {
    const value=request.headers.get('origin')??'';origin=new URL(value);
    if(origin.origin!==value||!['http:','https:'].includes(origin.protocol)||origin.host!==request.headers.get('host')||request.headers.get('sec-fetch-site')==='cross-site')throw new Error();
  } catch {return NextResponse.json({error:'Request not allowed.'},{status:403,headers});}
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return NextResponse.json({error:'Invalid request.'},{status:415,headers});
  const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Invalid request.'},{status:400,headers});
  try {
    let size=0;const parts:Uint8Array[]=[];
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>64){await reader.cancel();return NextResponse.json({error:'Invalid request.'},{status:413,headers});}parts.push(value);}
    const value=JSON.parse(Buffer.concat(parts).toString('utf8'));
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1||!['en','hi'].includes(value.locale))return NextResponse.json({error:'Invalid language.'},{status:400,headers});
    const response=NextResponse.json({locale:value.locale},{headers});
    response.cookies.set('arms_language',value.locale,{httpOnly:true,sameSite:'lax',secure:origin.protocol==='https:',path:'/',maxAge:31536000});
    return response;
  }catch{return NextResponse.json({error:'Invalid request.'},{status:400,headers});}finally{reader.releaseLock();}
}
