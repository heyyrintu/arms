import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
export async function generateStaticParams() { return services.map(s => ({ slug: s.slug })); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const service = services.find(s => s.slug === slug); return service ? localizedMetadata(pageMetadata(service.label, service.intro)) : {}; }
export default async function SolutionDetail({ params }: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const service = services.find(item => item.slug === slug);
    if (!service) notFound();

    return localizeTree(
        <>
            <section className="page-hero container">
                <p className="eyebrow">WORKFORCE SOLUTIONS / {service.label.toUpperCase()}</p>
                <h1>{service.headline}</h1>
                <p className="lead">{service.intro}</p>
                <Link className="button button-dark" href="/hire-workforce">Request a Workforce Consultation ↗</Link>
            </section>
            <section className="section section-tint">
                <div className="container editorial-split">
                    <h2>What this service can include</h2>
                    <div className="editorial-list">
                        <ul className="feature-list">
                            {service.features.map(feature => <li key={feature}>{feature}</li>)}
                        </ul>
                        <p className="fineprint">Scope, legal obligations and service levels depend on the signed agreement. This page does not guarantee availability or outcome.</p>
                    </div>
                </div>
            </section>
            <section className="section container">
                <h2>Made for different operations.</h2>
                <p>Explore how this service applies across warehousing, transport, hospitality and gig work.</p>
                <Link className="text-link" href="/industries">Explore our industries ↗</Link>
            </section>
        </>,
        await getLocale(),
    );
}
