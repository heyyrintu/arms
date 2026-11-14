import {NextRequest} from 'next/server';
import {staffPost} from '@/lib/server/staff-http';
export const runtime='nodejs';
export async function POST(request:NextRequest) { return staffPost(request,'logout'); }
