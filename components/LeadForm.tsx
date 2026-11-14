import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import { industries } from "@/content/site";
import { privacyNotice, retentionSchedule } from "@/content/privacy";
type Kind = "employer" | "talent" | "application";
// Keep the preview inert even without JavaScript. Enable collection only when
// storage, privacy, validation, authorization and abuse controls are implemented.
export default async function LeadForm({ kind }: {
    kind: Kind;
    jobId?: string;
}) {
    const noticeId = `${kind}-form-notice`;
    const retention = retentionSchedule.find(rule => rule.id === (kind === "employer" ? "enquiries" : kind === "talent" ? "talent" : "applications"))!;
    return localizeTree(<div className="lead-form" data-privacy-notice-version={privacyNotice.version}>
   <p className="notice" id={noticeId}><strong>Submissions are not open yet.</strong> This form preview is disabled until secure storage and the privacy notice are approved. Do not enter personal details or a CV.</p>
   <fieldset disabled aria-describedby={noticeId}>
   <legend>{kind === "employer" ? "Workforce request preview" : kind === "talent" ? "Career profile preview" : "Job application preview"}</legend>
   <div className="form-grid">
    {kind === "employer" ? <>
      <label>Company name <input name="company" autoComplete="organization" required maxLength={120}/></label>
      <label>Contact person <input name="name" autoComplete="name" required maxLength={120}/></label>
      <label>Work email <input name="email" type="email" autoComplete="email" required maxLength={180}/></label>
      <label>Phone number <input name="phone" type="tel" autoComplete="tel" required maxLength={20}/></label>
      <label>Industry <select name="industry" required defaultValue=""><option value="" disabled>Select industry</option>{industries.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}<option value="other">Other</option></select></label>
      <label>Approximate headcount <input name="headcount" type="number" min="1" max="100000" required/></label>
      <label>Work location <input name="location" required maxLength={160}/></label>
      <label>Payroll preference <select name="payrollModel" defaultValue="undecided"><option value="undecided">Need guidance</option><option value="arms">ARMS-managed payroll</option><option value="client">Client-managed payroll</option></select></label>
      <label className="wide">Roles and shift requirements <textarea name="requirements" rows={4} required maxLength={2500}/></label>
    </> : <>
      <label>Full name <input name="name" autoComplete="name" required maxLength={120}/></label>
      <label>Mobile number <input name="phone" type="tel" autoComplete="tel" required maxLength={20}/></label>
      <label>Email (optional) <input name="email" type="email" autoComplete="email" maxLength={180}/></label>
      <label>Current location <input name="location" autoComplete="address-level2" required maxLength={160}/></label>
      {kind === "talent" && <><label>Preferred industry <select name="industry" required defaultValue=""><option value="" disabled>Select industry</option>{industries.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}<option value="other">Other</option></select></label><label>Preferred role <input name="preferredRole" required maxLength={140}/></label></>}
      <label className="wide">Experience and relevant skills <textarea name="experience" rows={3} required maxLength={1800}/></label>
      <label className="wide">Resume (optional PDF, up to 5 MB; unavailable in preview) <input name="resume" type="file" accept=".pdf,application/pdf"/></label>
    </>}
   </div>
   <p className="fineprint">Proposed retention: {retention.period.toLowerCase()}. {retention.trigger} See the draft notice for deletion requests and legal exceptions.</p>
   <label className="consent"><input name="consent" type="checkbox" required/><span>I have read the <a href="/privacy">draft privacy notice</a>. {kind === "employer" ? "I request contact and processing of my details about this workforce enquiry." : kind === "talent" ? "I choose to join the career network and be contacted about suitable future roles." : "I request processing of my information for this job application."} This does not subscribe me to unrelated marketing.</span></label>
   {kind === "application" && <label className="consent"><input name="talentNetworkOptIn" type="checkbox"/><span>Optional: also keep my profile in the career network for suitable future roles under its separate 24-month retention period.</span></label>}
   <button type="button" className="button button-dark" disabled>Submissions unavailable</button>
   </fieldset>
 </div>, await getLocale());
}
