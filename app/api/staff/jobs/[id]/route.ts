import {NextRequest} from 'next/server';
import {jobMutation} from '@/lib/server/jobs-http';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return jobMutation(request,(await params).id);}
