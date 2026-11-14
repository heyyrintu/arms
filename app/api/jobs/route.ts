import {NextResponse} from 'next/server';
import {getPublicJobs} from '@/lib/server/jobs';
export const dynamic='force-dynamic';
export async function GET() {
  const result=await getPublicJobs();
  return NextResponse.json(result.unavailable?{error:'Job listings are temporarily unavailable.'}:{items:result.jobs.filter(job=>!job.isSample)},
    {status:result.unavailable?503:200,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
