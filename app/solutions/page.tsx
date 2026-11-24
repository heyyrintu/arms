import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import WorkforceServices from "@/components/WorkforceServices";
import { pageMetadata } from "@/lib/metadata";
import { localizeTree } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/server/locale";

export async function generateMetadata() {
  return localizedMetadata(pageMetadata("Workforce Solutions", "Talent acquisition, workforce coordination and contract-specific payroll administration."));
}

export default async function Solutions() {
  const locale = await getLocale();
  return localizeTree(
    <>
      <section className="page-hero container">
        <p className="eyebrow">FOR EMPLOYERS / WORKFORCE SOLUTIONS</p>
        <h1>Beyond recruitment.<br /><span>Built for real work.</span></h1>
        <p className="lead">Recruitment, deployment, workforce operations and payroll support — connected through one flexible service approach.</p>
        <Link href="/hire-workforce" className="button button-dark">Discuss Your Requirements ↗</Link>
      </section>
      <section className="section section-paper">
        <div className="container">
          <SectionIntro eyebrow="OUR THREE PILLARS" title="Build. Manage. Support.">
            Service responsibilities are agreed per client. We support both ARMS-managed and client-managed payroll arrangements.
          </SectionIntro>
          <WorkforceServices locale={locale} />
        </div>
      </section>
      <section className="section container">
        <SectionIntro eyebrow="FLEXIBLE EMPLOYMENT MODELS" title="The right operating model for each contract.">
          Where the worker is employed and who is responsible for payroll, records and statutory obligations must be defined in the agreement.
        </SectionIntro>
        <div className="audience-grid">
          <article className="audience-card">
            <h3>ARMS-managed payroll</h3>
            <p>ARMS manages the payroll responsibilities specifically agreed under the applicable employment and service arrangements.</p>
          </article>
          <article className="audience-card">
            <h3>Client-managed payroll</h3>
            <p>The client remains responsible for its payroll and employment duties, while ARMS delivers the agreed recruitment and coordination support.</p>
          </article>
        </div>
      </section>
    </>,
    locale,
  );
}
