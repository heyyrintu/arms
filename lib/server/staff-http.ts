import 'server-only';
import {NextRequest,NextResponse} from 'next/server';
import {getStaffAuth,staffConfiguration,staffCookie,challengeCookie,cookieOptions} from './staff';

const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
export async function staffPost(request:NextRequest, action:'login'|'verify'|'logout') {
  const config=staffConfiguration();
  if (!config.ready) return NextResponse.json({error:'Staff sign-in is not configured yet.'},{status:503,headers});
  if (request.headers.get('origin')!==config.origin || request.headers.get('sec-fetch-site')==='cross-site') {
    return NextResponse.json({error:'Request not allowed.'},{status:403,headers});
  }
  try {
    let data:Record<string,unknown>={};
    if (action!=='logout') {
      if (request.headers.get('content-type')?.split(';')[0]!=='application/json') return NextResponse.json({error:'Invalid request.'},{status:415,headers});
      const reader=request.body?.getReader();
      if (!reader) throw new Error('INVALID_REQUEST');
      const parts:Uint8Array[]=[];let size=0;
      try {
        for (;;) {
          const {done,value}=await reader.read();if(done) break;
          size+=value.byteLength;
          if(size>4096) {await reader.cancel();throw new Error('INVALID_REQUEST');}
          parts.push(value);
        }
      } finally {reader.releaseLock();}
      const parsed=JSON.parse(Buffer.concat(parts).toString('utf8'));
      if (!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error('INVALID_REQUEST');
      data=parsed;
    }
    const auth=await getStaffAuth();
    const response=NextResponse.json({step:action==='logout'?'signed_out':'complete'},{headers});
    if(action==='logout') {
      await auth.logout(request.cookies.get(staffCookie())?.value);
      response.cookies.set(staffCookie(),'',cookieOptions(0));
      response.cookies.set(challengeCookie(),'',cookieOptions(0));
      return response;
    }
    const result=action==='login'?await auth.start(data.loginId,data.password):await auth.verify(request.cookies.get(challengeCookie())?.value,data.code);
    const output=NextResponse.json({step:result.step},{headers});
    // JSON responses never include tokens, email addresses or the OTP.
    if(result.step==='verify') output.cookies.set(challengeCookie(),result.challenge!,cookieOptions(result.maxAge));
    else {
      const old=request.cookies.get(staffCookie())?.value;
      if(old) await auth.logout(old);
      output.cookies.set(staffCookie(),result.session!,cookieOptions(result.maxAge));
      output.cookies.set(challengeCookie(),'',cookieOptions(0));
    }
    return output;
  } catch (error) {
    const code=error instanceof Error?error.message:'';
    const status=code==='RATE_LIMITED'?429:['INVALID_LOGIN','INVALID_CODE'].includes(code)?401:code==='INVALID_REQUEST'||error instanceof SyntaxError?400:503;
    const message=status===429?'Too many attempts. Wait before trying again.':status===401?'Sign-in details or code could not be verified.':status===400?'Invalid request.':'Staff sign-in is temporarily unavailable. Please try again later.';
    return NextResponse.json({error:message},{status,headers:{...headers,...(status===429?{'Retry-After':'900'}:{})}});
  }
}
