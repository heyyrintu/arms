import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import SignOut from './SignOut';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStaffAuth, staffCookie } from '@/lib/server/staff';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata({ title: 'Staff workspace', robots: { index: false, follow: false } });
}
export default async function Admin() {
    let authorized = false;
    let canAddJobs = false;
    try {
        const auth = await getStaffAuth();
        const staff = await auth.authorize((await cookies()).get(staffCookie())?.value, ['admin', 'recruiter', 'business_development']);
        authorized = !!staff;
        canAddJobs = staff?.role === 'admin';
    }
    catch { /* Fail closed; no applicant records are loaded. */ }
    if (!authorized)
        redirect('/admin/sign-in');
    return localizeTree(<section className="container section staff-panel"><p className="eyebrow">ARMS Talent Partners / Staff</p><h1>Staff workspace</h1>
    <p>You are signed in. Personal-data collection remains closed.</p>
    {canAddJobs && <section className="staff-job-entry" aria-labelledby="staff-jobs-heading"><p className="eyebrow">Vacancies</p><h2 id="staff-jobs-heading">Job postings</h2><p>Save drafts, preview and approve genuine vacancies, and close or archive finished listings.</p><div className="job-editor-actions"><Link href="/admin/jobs/new" className="button button-dark">Add job posting <span aria-hidden="true">＋</span></Link><Link href="/admin/jobs" className="button button-outline">Manage postings</Link></div></section>}
    {canAddJobs && <section className="staff-job-entry"><h2>Submission review</h2><p>Review saved enquiries and candidate records with restricted access. Public collection remains closed.</p><div className="job-editor-actions"><Link className="button button-outline" href="/admin/intake/employer">Employer enquiries</Link><Link className="button button-outline" href="/admin/intake/talent">Career profiles</Link><Link className="button button-outline" href="/admin/intake/application">Applications</Link></div></section>}
    <p>Close this session using the sign-out control below.</p><SignOut /></section>, await getLocale());
}
