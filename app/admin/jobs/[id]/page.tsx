import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { authorizeJobs, getJobsService, jobsReady, type StoredJob } from '@/lib/server/jobs';
import { industries } from '@/content/site';
import JobPostingForm from '../new/JobPostingForm';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata({ title: 'Manage job posting | Staff', robots: { index: false, follow: false } });
}
export default async function EditJob({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    let authorized = false;
    try {
        authorized = !!await authorizeJobs();
    }
    catch { }
    if (!authorized)
        redirect('/admin/sign-in');
    const { id } = await params;
    let job: StoredJob | undefined;
    let missing = false;
    let activity: {
        action: string;
        revision: number;
        created_at: Date;
    }[] = [];
    try {
        const service = await getJobsService();
        job = await service.get(id);
        activity = await service.activity(id);
    }
    catch (error) {
        missing = error instanceof Error && error.message === 'NOT_FOUND';
    }
    if (missing)
        notFound();
    return localizeTree(<section className="container section staff-job-editor"><Link className="text-link" href="/admin/jobs">← Job postings</Link><header className="job-editor-header"><p className="eyebrow">ARMS Talent Partners / Jobs</p><h1>Manage job posting</h1><p className="lead">Save revisions, review details and record publication approval.</p></header>
    {!job ? <p role="alert" className="notice">This saved posting could not be loaded. Job storage may be temporarily unavailable. Your saved data has not been changed.</p> : <><JobPostingForm key={job.id} initialJob={JSON.parse(JSON.stringify(job))} storageReady={jobsReady()} industries={industries.map(({ slug, name }) => ({ slug, name }))}/>
    <section className="staff-job-activity"><h2>Saved activity</h2><p className="fineprint">Activity recorded when this page was loaded. Reopen the saved posting for newer entries. Staff identities and approval references remain private.</p><ol>{activity.map((event, index) => <li key={index}>{event.action} · revision {event.revision} · {new Date(event.created_at).toISOString()}</li>)}</ol></section></>}
  </section>, await getLocale());
}
