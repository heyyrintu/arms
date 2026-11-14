import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
export async function generateMetadata() {
    return localizedMetadata(pageMetadata("Candidate Support", "Guidance for ARMS applicants and workers."));
}
export default async function CandidateSupport() { return localizeTree(<><section className="page-hero container"><p className="eyebrow">FOR APPLICANTS AND WORKERS</p><h1>Support at every<br /><span>step.</span></h1><p className="lead">Know where to go for applications, role questions and matters related to your employment arrangement.</p></section><section className="section container"><div className="service-grid"><article className="service-card"><h2>Applying for work</h2><p>Browse openings and review the details published for each verified role.</p><Link className="text-link" href="/jobs">Explore Jobs ↗</Link></article><article className="service-card"><h2>Future opportunities</h2><p>When registration opens, join the career network to express interest in future vacancies.</p><Link className="text-link" href="/career">Career ↗</Link></article><article className="service-card"><h2>Employment & payroll queries</h2><p>Responsibilities depend on whether the employer is ARMS or the client. Approved contact and escalation details must be published before launch.</p><Link className="text-link" href="/contact">Contact ARMS ↗</Link></article></div></section></>, await getLocale()); }
