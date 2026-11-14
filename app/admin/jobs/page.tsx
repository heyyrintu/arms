import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authorizeJobs, getJobsService, type StoredJob } from '@/lib/server/jobs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata({ title: 'Job postings | Staff', robots: { index: false, follow: false } });
}
export default async function StaffJobs() {
    let authorized = false;
    try {
        authorized = !!await authorizeJobs();
    }
    catch { }
    if (!authorized)
        redirect('/admin/sign-in');
    let jobs: StoredJob[] = [];
    let unavailable = false;
    try {
        jobs = await (await getJobsService()).list();
    }
    catch {
        unavailable = true;
    }
    return localizeTree(<section className="container section staff-job-editor"><Link className="text-link" href="/admin">← Staff workspace</Link>
    <header className="job-editor-header"><p className="eyebrow">ARMS Talent Partners / Jobs</p><h1>Job postings</h1><p className="lead">Manage genuine vacancies from draft to close.</p><Link href="/admin/jobs/new" className="button button-dark">Add job posting ＋</Link></header>
    {unavailable ? <p className="notice" role="alert">Job storage is unavailable. Saved postings could not be loaded. Try again after checking the private connection.</p> : jobs.length ? <><p className="fineprint">Latest 100 postings. Expired listings are automatically excluded from public results.</p><div className="staff-job-list">{jobs.map(job => <article key={job.id}><div><p className="eyebrow">{job.status}{job.status === 'published' && job.expires_at && new Date(job.expires_at) <= new Date() ? ' · Expired' : ''} · Revision {job.revision}</p><h2 data-original><Link href={`/admin/jobs/${job.id}`}>{job.posting.title}</Link></h2><p><span data-original>{job.posting.location}</span> · {job.posting.employmentType}</p></div><Link className="text-link" href={`/admin/jobs/${job.id}`}>Manage posting ↗</Link></article>)}</div></> : <div className="empty-state"><h2>No saved job postings yet.</h2><p>Add a private draft using verified vacancy details. Nothing is published until you approve a saved revision.</p></div>}
  </section>, await getLocale());
}
