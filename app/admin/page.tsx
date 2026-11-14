import type {Metadata} from 'next';
import SignOut from './SignOut';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getStaffAuth,staffCookie} from '@/lib/server/staff';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Staff workspace',robots:{index:false,follow:false}};
export default async function Admin() {
  let authorized=false;
  try {
    const auth=await getStaffAuth();
    authorized=!!await auth.authorize((await cookies()).get(staffCookie())?.value,['admin','recruiter','business_development']);
  } catch { /* Fail closed; no applicant records are loaded. */ }
  if(!authorized) redirect('/admin/sign-in');
  return <section className="container section staff-panel"><p className="eyebrow">ARMS Talent Partners / Staff</p><h1>Staff workspace</h1>
    <p>You are signed in. Job management and applicant workflows are still being built. Personal-data collection remains closed.</p>
    <p>Close this session using the sign-out control below.</p><SignOut/></section>;
}
