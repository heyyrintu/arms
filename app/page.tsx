import Link from "next/link";
import WorkplaceImage from "@/components/WorkplaceImage";
import WorkforceServices from "@/components/WorkforceServices";
import { industries, industryName } from "@/content/site";
import { localizeTree, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";
import { getPublicJobs } from "@/lib/server/jobs";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";
const stages = ["Plan", "Source", "Deploy", "Coordinate", "Administer", "Improve"];
const examplePlan = [
  { team: "Warehouse associates", shift: "Morning", stage: "Sourcing" },
  { team: "Commercial drivers", shift: "Day", stage: "Screening" },
  { team: "Service associates", shift: "Evening", stage: "Deployment" },
  { team: "Event support crews", shift: "Flexible", stage: "Planning" },
];
const questions = [
  {
    question: "What workforce services does ARMS provide?",
    answer: "ARMS supports sourcing, screening, onboarding, deployment, shift and attendance coordination, and payroll administration. The services and responsibilities are agreed with each client.",
  },
  {
    question: "Who manages payroll?",
    answer: "ARMS or the client can manage payroll. The signed agreement defines the employer, payroll responsibilities and any administrative support ARMS provides.",
  },
  {
    question: "Can I hire for a short-term project?",
    answer: "You can discuss staffing for delivery, events and other short-term operations. The scope, shifts and responsibilities depend on the assignment.",
  },
  {
    question: "Where can I find current openings?",
    answer: "The jobs page shows published vacancies when available. Each listing gives the location, eligibility and other details for that role.",
  },
];

function AudienceActions({ locale }: { locale: Locale }) {
  return localizeTree(
    <div className={styles.actions}>
      <Link className={styles.primaryButton} href="/hire-workforce">Hire Workforce <span aria-hidden="true">↗</span></Link>
      <Link className={styles.secondaryButton} href="/jobs">Find Work <span aria-hidden="true">↗</span></Link>
    </div>,
    locale,
  );
}

function WorkforcePlan({ locale }: { locale: Locale }) {
  return localizeTree(
    <div className={styles.roster}>
      <table>
        <caption>
          <span className={styles.rosterHeading}><strong>Workforce plan</strong><span>Illustrative example</span></span>
        </caption>
        <thead><tr><th scope="col">Team</th><th scope="col">Shift</th><th scope="col">Stage</th></tr></thead>
        <tbody>
          {examplePlan.map(({ team, shift, stage }) => (
            <tr key={team}><th scope="row">{team}</th><td>{shift}</td><td><span>{stage}</span></td></tr>
          ))}
        </tbody>
      </table>
    </div>,
    locale,
  );
}

export default async function Home() {
  const [locale, { jobs, unavailable }] = await Promise.all([getLocale(), getPublicJobs()]);
  const isDemo = jobs.some(job => job.isSample);
  return localizeTree(
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.shell}>
          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Workforce management</p>
              <h1 id="home-title">Great people.<br /><em className="editorial-accent">Greater possibilities.</em></h1>
              <p>We help businesses build and manage the teams that keep operations moving, while connecting people with opportunities to build their future.</p>
              <AudienceActions locale={locale} />
            </div>
            <div className={`${styles.heroVisual} editorial-frame`}>
              <WorkplaceImage category="hero" variant="panorama" sizes="(max-width: 650px) 90vw, (max-width: 900px) 630px, (max-width: 1440px) 40vw, 540px" />
            </div>
          </div>
        </div>
        <div className={styles.sectors}>
          <nav className={`${styles.shell} ${styles.sectorStrip}`} aria-label="Industries we support">
            <p>Industries we support</p>
            <ul>
              {industries.map(({ slug, name }) => <li key={slug}><a href={`#home-${slug}`}>{name} <span aria-hidden="true">↗</span></a></li>)}
            </ul>
          </nav>
        </div>
      </section>

      <section className={styles.operations} aria-labelledby="home-solutions">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Workforce Solutions</p>
            <h2 id="home-solutions">One connected <em className="editorial-accent">workforce partner.</em></h2>
          </div>
          <WorkforceServices locale={locale} />
        </div>
      </section>

      <section className={styles.lifecycle} aria-labelledby="home-process">
        <div className={`${styles.shell} ${styles.lifecycleLayout}`}>
          <div>
            <p className={styles.eyebrow}>HOW WE WORK</p>
            <h2 id="home-process">People. Operations. Progress.</h2>
            <p>A connected workforce lifecycle, adapted to the service and payroll responsibilities agreed with each client.</p>
            <ol className={styles.stages} aria-label="Workforce lifecycle">
              {stages.map((stage) => <li key={stage}>{stage}</li>)}
            </ol>
          </div>
          <WorkforcePlan locale={locale} />
        </div>
      </section>

      <section className={`${styles.shell} ${styles.industries}`} aria-labelledby="home-industries">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>INDUSTRIES WE SERVE</p>
          <h2 id="home-industries">Different worlds. <em className="editorial-accent">One workforce partner.</em></h2>
        </div>
        <div className={styles.industryGrid}>
          {industries.map((industry) => (
            <article key={industry.slug} id={`home-${industry.slug}`}>
              <WorkplaceImage category={industry.photoCategory} sizes="(max-width: 650px) 90vw, (max-width: 900px) 44vw, (max-width: 1440px) 22vw, 310px" />
              <div className={styles.industryCopy}>
                <h3><Link href={`/industries/${industry.slug}`}>{industry.name}<span aria-hidden="true">↗</span></Link></h3>
                <p>{industry.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.audiences} aria-labelledby="home-audiences">
        <div className={styles.shell}>
          <h2 id="home-audiences">For the teams you build. <em className="editorial-accent">For the future you pursue.</em></h2>
          <div className={styles.audienceGrid}>
            <article id="home-employers">
              <p className={styles.eyebrow}>FOR BUSINESSES</p>
              <h3>Stronger teams. Smarter operations.</h3>
              <p>Source, deploy and coordinate your workforce with services shaped around your operation.</p>
              <Link className={styles.textLink} href="/solutions">Workforce Solutions</Link>
            </article>
            <article id="home-job-seekers">
              <p className={styles.eyebrow}>FOR JOB SEEKERS</p>
              <h3>Find work. Build what comes next.</h3>
              <p>Explore current roles or join the career network to hear about suitable future opportunities.</p>
              <div className={styles.links}>
                <Link className={styles.textLink} href="/jobs">Find Jobs</Link>
                <Link className={styles.textLink} href="/career">Explore Career</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section jobs-section" aria-labelledby="home-jobs">
        <div className={styles.shell}>
          <div className="split-intro">
            <div className="section-intro">
              <p className="eyebrow">OPPORTUNITY IN ACTION</p>
              <h2 id="home-jobs">Real work. Real opportunities.</h2>
              <p className="section-summary">Explore verified vacancies when available, or register your profile for future openings.</p>
            </div>
            <Link className="button button-outline" href="/jobs">Browse Jobs ↗</Link>
          </div>
          {isDemo && <p className="notice"><strong>Preview listings:</strong> The examples below are fictional and are not open for applications.</p>}
          <div className="job-preview">
            {unavailable ? (
              <div className="notice" role="alert">
                <h3>Job listings are temporarily unavailable.</h3>
                <p>Please try again later to check current vacancies.</p>
              </div>
            ) : jobs.length ? jobs.slice(0, 3).map(job => (
              <article key={job.id} className="job-preview-item">
                <div>
                  <p className="eyebrow">{industryName(job.industrySlug)}{job.isSample ? " · SAMPLE" : ""}</p>
                  <h3 data-original>{job.title}</h3>
                  <p><span data-original>{job.location}</span> · {job.type}</p>
                </div>
                <Link className="text-link" href={`/jobs/${job.slug}`}>Details ↗</Link>
              </article>
            )) : (
              <div className="empty-state">
                <h3>No live vacancies published yet.</h3>
                <p>Career registration is not open yet. You can review the registration preview for future opportunities.</p>
              </div>
            )}
          </div>
          <div className="section-end"><Link href="/career" className="text-link">Career ↗</Link></div>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="home-faq">
        <div className={`${styles.shell} ${styles.faqLayout}`}>
          <div>
            <h2 id="home-faq">Common questions</h2>
            <Link href="/contact" className={styles.textLink}>Contact <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={styles.questions}>
            {questions.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="home-closing">
        <div className={`${styles.shell} ${styles.closingInner}`}>
          <div>
            <p className={styles.eyebrow}>TOGETHER FOR A BETTER TOMORROW</p>
            <h2 id="home-closing">People power progress.</h2>
          </div>
          <AudienceActions locale={locale} />
        </div>
      </section>
    </div>,
    locale,
  );
}
