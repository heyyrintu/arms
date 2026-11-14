import Link from "next/link";
import {pageMetadata} from "@/lib/metadata";
import {privacyNotice,retentionSchedule} from "@/content/privacy";

export const metadata=pageMetadata("Privacy Notice","Draft privacy notice and proposed recruitment-data retention schedule for ARMS Talent Partners.");

export default function Privacy(){
  return <section className="page-hero container narrow privacy-notice">
    <p className="eyebrow">PRIVACY & YOUR INFORMATION</p>
    <h1>Privacy notice.</h1>
    <p className="fineprint">Draft version {privacyNotice.version} · Updated {privacyNotice.reviewedOn}</p>
    <div className="notice"><strong>Draft for review — submissions remain disabled.</strong> This notice describes the intended handling of information once recruitment services open on this website. Legal review and the remaining security and data-handling controls are required before collection opens. Do not send personal details or a CV through this preview.</div>

    <nav aria-label="Privacy notice contents" className="privacy-contents">
      <a href="#privacy-operator">Who handles your information</a>
      <a href="#privacy-information">Information and purposes</a>
      <a href="#privacy-sharing">Sharing and storage</a>
      <a href="#privacy-retention">Retention and deletion</a>
      <a href="#privacy-rights">Your choices and requests</a>
    </nav>

    <h2 id="privacy-operator" tabIndex={-1}>Who handles your information</h2>
    <p>This website is operated by {privacyNotice.legalOperator}, referred to in this notice as ARMS Talent Partners or ARMS. Contact us at the email or business address below with privacy questions or requests.</p>
    <dl className="privacy-details"><dt>Legal operator</dt><dd>{privacyNotice.legalOperator}</dd><dt>Privacy contact email</dt><dd><a href={`mailto:${privacyNotice.privacyEmail}`}>{privacyNotice.privacyEmail}</a></dd><dt>Business address</dt><dd>{privacyNotice.businessAddress}</dd></dl>
    <p>This notice covers website job applications, talent-network registration and employer enquiries. Employment, attendance and payroll records require separate notices and schedules reflecting the employing entity and signed arrangements, including ARMS-managed or client-managed payroll.</p>

    <h2 id="privacy-information" tabIndex={-1}>Information and purposes</h2>
    <ul className="privacy-list">
      <li><strong>Job applicants:</strong> name, mobile number, optional email, current location, experience and an optional CV, together with the job applied for, recruitment status and relevant recruiter notes. These support assessment, recruitment communication and handling that application.</li>
      <li><strong>Talent-network members:</strong> contact details, location, preferred industry and role, experience, optional CV and the record of your separate opt-in. These support contact about suitable future roles.</li>
      <li><strong>Employer enquiries:</strong> company and contact names, work email, phone, industry, work location, headcount, role/shift requirements and payroll preference. These support discussing the requested workforce services and following up on the enquiry.</li>
      <li><strong>Service and security records:</strong> submission reference, notice version, permission/withdrawal records, relevant timestamps and limited access or abuse-prevention information. These support accountability, requests and service security.</li>
    </ul>
    <p>Information will ordinarily come from you and your interactions with the recruitment team. The public forms will not request Aadhaar/PAN numbers, bank information, medical records or other unnecessary sensitive documents. Please keep irrelevant personal information out of your CV and free-text answers.</p>
    <p>This preview does not collect applications, accept CV uploads or use advertising analytics. No candidate account is required for the planned public application flow. The MVP does not use automated CV scoring or automatic rejection.</p>

    <h2>Your permission and separate purposes</h2>
    <p>Before an active form collects information, it will explain the relevant purpose and record the applicable notice and permission. Applying for a particular job does not automatically enrol you in the talent network or subscribe you to marketing. Any future-role opt-in must be separate and optional.</p>
    <p>You may withdraw a recruitment permission or ask to leave the talent network by emailing <a href={`mailto:${privacyNotice.privacyEmail}`}>{privacyNotice.privacyEmail}</a>. Withdrawal stops the related optional processing going forward; records still needed for a specific legal requirement or documented dispute must be limited to that purpose.</p>
    <p>The public forms are intended for adults aged 18 or over. Any recruitment involving younger people requires a separately approved process and any legally required parental/guardian permissions before collection.</p>

    <h2 id="privacy-sharing" tabIndex={-1}>Sharing and storage</h2>
    <p>The proposed recipients are authorised ARMS recruitment or business staff; a relevant prospective employer where needed for the role and explained to you; and contracted providers supporting hosting, private document storage, staff sign-in, delivery of acknowledgements or security. Share only the information necessary for that task.</p>
    <p>Information may also need to be disclosed to a competent authority or adviser where required by law or necessary for a specific legal matter. The proposed policy does not permit selling candidate profiles or unrelated marketing use.</p>
    <p>Before collection opens, ARMS must confirm the provider contracts, hosting locations, any access or transfers outside India, and applicable safeguards. The intended controls include server-side staff permissions, private CV storage, restricted document downloads and protected connections. These controls are launch requirements; this draft does not claim the unfinished integrations are operational.</p>

    <h2 id="privacy-retention" tabIndex={-1}>Retention and deletion</h2>
    <p>The following are selected project defaults for review, rather than a universal statutory retention period. Keep identifiable information only while its stated purpose or a specific applicable legal requirement remains valid.</p>
    <div className="privacy-retention-list">{retentionSchedule.map(rule=><article key={rule.id}><h3>{rule.category}</h3><p><strong>{rule.period}.</strong> {rule.trigger}</p><p className="fineprint">{rule.detail}</p></article>)}</div>
    <p>Delete or anonymise records at expiry, or earlier when a valid request or the end of the purpose calls for it, unless a specific legal minimum or documented hold requires limited preservation. A hold must record its reason, scope and review date; it must not authorise continued recruitment or marketing use.</p>
    <p>CVs, application links, talent profiles and backup copies must be handled together so a deletion is not undone by a retained copy. Data kept for employment, payroll, tax or an active client contract follows a separate, legally reviewed schedule; these recruitment defaults do not determine those periods.</p>

    <h2 id="privacy-rights" tabIndex={-1}>Your choices and requests</h2>
    <p>Depending on the applicable law, you may request information about processing, correction or updating, erasure, withdrawal of permission, or help with a privacy concern. Where applicable, you may nominate someone to exercise rights and use the appropriate statutory complaint route. ARMS must publish the relevant rights and escalation instructions before launch.</p>
    <p>The proposed operational target is to acknowledge a privacy request within seven days and resolve it within 30 days after proportionate identity verification, subject to applicable legal requirements and any explained exception. These are project service targets, not a statement of a universal legal deadline. Identity checks should request no more information than needed.</p>
    <div className="notice"><strong>Privacy questions and requests:</strong> Email <a href={`mailto:${privacyNotice.privacyEmail}`}>{privacyNotice.privacyEmail}</a> or write to the business address above. Please do not email CVs, passwords or identity documents; the team should arrange a proportionate verification method if needed. <Link href="/contact">View the contact page</Link> for general enquiries.</div>

    <h2>Cookies and changes to this notice</h2>
    <p>The preview has no advertising or analytics integration. Before staff sign-in or other optional services are introduced, their necessary cookies and any non-essential tracking must be reviewed and disclosed. Optional tracking must not be treated as consent to recruitment processing.</p>
    <p>Material changes to purposes, recipients or retention must be reflected in a new dated notice and communicated appropriately. A saved application must retain the version of the notice shown when it was submitted; a later notice must not silently expand an earlier permission.</p>
  </section>;
}
