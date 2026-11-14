import type {Metadata} from 'next';
import {staffConfiguration} from '@/lib/server/staff';
import SignIn from './SignIn';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Staff sign-in',robots:{index:false,follow:false}};
export default function StaffSignIn() {
  const {ready}=staffConfiguration();
  return <section className="container section staff-panel"><p className="eyebrow">ARMS Talent Partners / Staff</p><h1>Staff sign-in</h1>
    {ready?<SignIn/>:<p role="status">Staff sign-in is not available yet. Your administrator is completing secure database and email setup.</p>}
    <p>Job seekers do not need an account to apply when applications open.</p></section>;
}
