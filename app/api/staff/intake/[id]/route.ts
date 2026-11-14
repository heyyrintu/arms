import {NextRequest} from 'next/server';
import {intakeMutation} from '@/lib/server/intake-http';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 return intakeMutation(request,(await params).id);
}
