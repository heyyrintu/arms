import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import Link from 'next/link';
import LeadForm from "@/components/LeadForm";
import { pageMetadata } from "@/lib/metadata";
export async function generateMetadata() {
    return localizedMetadata(pageMetadata("Career", "Register your interest for suitable future ARMS opportunities."));
}
export default async function TalentNetwork() { return localizeTree(<><section className="page-hero container"><p className="eyebrow">FOR PEOPLE / BUILD WHAT’S NEXT</p><h1>Bring your skills.<br /><span>Find possibilities.</span></h1><p className="lead">Explore regular roles, project assignments and gig opportunities. When career registration opens, you can share your preferences for suitable future work.</p><Link className="button button-dark" href="/jobs">Find Jobs ↗</Link></section><section className="section section-tint" id="career-profile"><div className="container narrow"><h2>Build your career.</h2><p>Registration does not guarantee a job or placement, and information is used according to the privacy notice.</p><LeadForm kind="talent"/></div></section></>, await getLocale()); }
