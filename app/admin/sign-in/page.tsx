import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import { staffConfiguration } from '@/lib/server/staff';
import SignIn from './SignIn';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata({ title: 'Staff sign-in', robots: { index: false, follow: false } });
}
export default async function StaffSignIn() {
    const { ready } = staffConfiguration();
    return localizeTree(<section className="container section staff-panel"><p className="eyebrow">ARMS Talent Partners / Staff</p><h1>Staff sign-in</h1>
    {ready ? <SignIn /> : <div className="editorial-list"><p role="status">Staff sign-in is not available yet. Your administrator is completing secure database and email setup.</p></div>}
    <p>Job seekers do not need an account to apply when applications open.</p></section>, await getLocale());
}
