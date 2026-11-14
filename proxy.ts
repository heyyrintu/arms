import {NextRequest,NextResponse} from 'next/server';
import {gateCookie,verifyGate} from '@/lib/staging/gate.mjs';
export function proxy(request:NextRequest) {
 if(process.env.ARMS_PRIVATE_STAGING!=='true')return NextResponse.next();
 const path=request.nextUrl.pathname;
 if(path==='/staging/unlock'||path==='/api/staging/unlock'||path.startsWith('/_next/')||path==='/icon.png')return NextResponse.next();
 if(verifyGate(request.cookies.get(gateCookie)?.value,process.env))return NextResponse.next();
 return new NextResponse('Private synthetic staging. Access is required.',{status:401,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Type':'text/plain; charset=utf-8'}});
}
