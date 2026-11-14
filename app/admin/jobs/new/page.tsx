import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStaffAuth, staffCookie } from '@/lib/server/staff';
import { industries } from '@/content/site';
import JobPostingForm from './JobPostingForm';
import { jobsReady } from '@/lib/server/jobs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata({ title: 'Add job posting | Staff', robots: { index: false, follow: false } });
}
export default async function NewJobPosting() {
    let authorized = false;
    try {
        const auth = await getStaffAuth();
        authorized = !!await auth.authorize((await cookies()).get(staffCookie())?.value, ['admin']);
    }
    catch { /* Fail closed before rendering the editor. */ }
    if (!authorized)
        redirect('/admin/sign-in');
    return localizeTree(<section className="container section staff-job-editor">
    <Link href="/admin/jobs" className="text-link">← Job postings</Link>
    <header className="job-editor-header"><p className="eyebrow">ARMS Talent Partners / Jobs</p><h1>Add job posting</h1><p className="lead">Give candidates a clear picture of the work ahead.</p></header>
    <p className="notice">Save a private draft, preview the saved revision, then record your approval to publish a genuine vacancy. Applications remain closed.</p>
    <JobPostingForm storageReady={jobsReady()} industries={industries.map(({ slug, name }) => ({ slug, name }))}/>
  </section>, await getLocale());
}
