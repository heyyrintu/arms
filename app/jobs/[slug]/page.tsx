import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { industryName } from '@/content/site';
import { getPublicJob } from '@/lib/server/jobs';
import { payrollModels } from '@/lib/job-posting.mjs';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { job } = await getPublicJob((await params).slug);
    return job ? pageMetadata(job.title, job.description.slice(0, 160)) : {};
}
export default async function JobDetail({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { job, unavailable } = await getPublicJob((await params).slug);
    if (unavailable)
        return localizeTree(<section className="container section narrow"><h1>Job details are temporarily unavailable.</h1><p>We could not verify this vacancy’s current status. Please try again later.</p><Link className="text-link" href="/jobs">Back to jobs ↗</Link></section>, await getLocale());
    if (!job)
        notFound();
    return localizeTree(<><section className="page-hero container"><p className="eyebrow">{industryName(job.industrySlug)} · {job.isSample ? 'SAMPLE ROLE' : 'OPEN ROLE'}</p><h1 data-original>{job.title}</h1><p className="lead"><span data-original>{job.location}</span> · {job.type} · {job.experience==='Experience details not specified'?job.experience:<span data-original>{job.experience}</span>} · Salary: {job.pay}</p>
    {job.isSample && <div className="notice"><strong>Not an active job:</strong> This page demonstrates the intended job-detail format. You cannot apply for it.</div>}</section>
    <section className="section container narrow"><h2>About the role</h2><p className="job-plain-text" data-original>{job.description}</p>
    {job.employer && <p><strong>Employer:</strong> <span data-original>{job.employer}</span></p>}
    {job.payrollModel && <p><strong>Payroll arrangement:</strong> {payrollModels[job.payrollModel as keyof typeof payrollModels]}. Responsibilities follow the signed arrangement.</p>}
    {job.schedule && <p><strong>Schedule:</strong> <span data-original>{job.schedule}</span></p>}
    {job.expiresAt && <p><strong>Closes:</strong> {new Date(job.expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} India time</p>}
    <h3>Responsibilities</h3><ul className="feature-list">{job.responsibilities.map((text, index) => <li key={index} data-original>{text}</li>)}</ul><h3>Requirements</h3><ul className="feature-list">{job.requirements.map((text, index) => <li key={index} data-original>{text}</li>)}</ul>
    <p className="notice">Applications are not open yet. Do not send personal details or a CV through this preview.</p><Link href="/career" className="button button-dark">Explore Career ↗</Link></section></>, await getLocale());
}
