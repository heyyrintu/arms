import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from "next/link";
import { notFound } from "next/navigation";
import WorkplaceImage from "@/components/WorkplaceImage";
import { industries } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
export async function generateStaticParams() { return industries.map(i => ({ slug: i.slug })); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const i = industries.find(x => x.slug === slug); return i ? localizedMetadata(pageMetadata(i.name, i.summary)) : {}; }
export default async function IndustryDetail({ params }: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const industry = industries.find(i => i.slug === slug);
    if (!industry) notFound();

    return localizeTree(
        <>
            <section className="page-hero page-hero-split container">
                <div>
                    <p className="eyebrow">{industry.name}</p>
                    <h1>{industry.headline}</h1>
                    <p className="lead">{industry.summary}</p>
                </div>
                <div className="editorial-frame">
                    <WorkplaceImage category={industry.photoCategory} variant="feature" sizes="(max-width: 700px) 90vw, (max-width: 900px) 630px, (max-width: 1440px) 40vw, 550px" />
                </div>
            </section>
            <section className="section section-paper">
                <div className="container editorial-split">
                    <div>
                        <p className="eyebrow">ROLES WE SUPPORT</p>
                        <h2>Built around the work.</h2>
                    </div>
                    <div className="editorial-list">
                        <ul className="feature-list compact">
                            {industry.roles.map(role => <li key={role}>{role}</li>)}
                        </ul>
                    </div>
                </div>
            </section>
            <section className="section section-tint">
                <div className="container audience-grid">
                    <article className="audience-card">
                        <p className="eyebrow">FOR EMPLOYERS</p>
                        <h2>Support for your operation.</h2>
                        <p>{industry.employerAngle}</p>
                        <Link className="text-link" href="/hire-workforce">Request Workforce ↗</Link>
                    </article>
                    <article className="audience-card">
                        <p className="eyebrow">FOR CANDIDATES</p>
                        <h2>Work that matches your ambition.</h2>
                        <p>{industry.candidateAngle}</p>
                        <Link className="text-link" href={`/jobs?industry=${industry.slug}`}>Explore Jobs ↗</Link>
                        <Link className="text-link" href="/career">Career ↗</Link>
                    </article>
                </div>
            </section>
        </>,
        await getLocale(),
    );
}
