import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import JobExplorer from '@/components/JobExplorer';
import { industries } from '@/content/site';
import { getPublicJobs } from '@/lib/server/jobs';
import { pageMetadata } from '@/lib/metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
    return localizedMetadata(pageMetadata('Find Jobs', 'Explore approved job openings and future career opportunities with ARMS.'));
}
export default async function Jobs({ searchParams }: {
    searchParams: Promise<{
        industry?: string | string[];
    }>;
}) {
    const filters = await searchParams;
    const initialIndustry = industries.some(i => i.slug === filters.industry) ? filters.industry as string : 'all';
    const { jobs, unavailable } = await getPublicJobs();
    return localizeTree(<><section className="page-hero container"><p className="eyebrow">CAREERS &amp; OPPORTUNITIES</p><h1>Your next opportunity<br /><span>starts here.</span></h1><p className="lead">Search verified open roles when available, or register to be considered for suitable future openings.</p><Link className="text-link" href="/career">No matching role? Explore Career ↗</Link></section>
    <section className="section section-tint"><div className="container">{jobs.some(job => job.isSample) && <p className="notice"><strong>Demonstration only:</strong> All listed roles are fictional samples, not live vacancies. Applications for sample roles are disabled.</p>}
    {unavailable ? <div className="notice" role="alert"><h2>Job listings are temporarily unavailable.</h2><p>We could not load current vacancies. Please try again later.</p></div> : <JobExplorer key={initialIndustry} jobs={jobs} initialIndustry={initialIndustry}/>}</div></section></>, await getLocale());
}
