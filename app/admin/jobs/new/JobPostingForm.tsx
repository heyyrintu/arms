'use client';
import {localizeTree} from '@/lib/i18n';
import {useLocale} from '@/components/LocaleProvider';

import { useRef, useState } from 'react';
import type { Industry } from '@/content/site';
import type { StoredJob } from '@/lib/server/jobs';
import { emptyJobPosting, employmentTypes, payrollModels, salaryPeriods, jobPostingErrors, jobPostingLines } from '@/lib/job-posting.mjs';
type Posting = ReturnType<typeof emptyJobPosting>;
type Field = keyof Posting;
type IndustryOption = Pick<Industry, 'slug' | 'name'>;
export default function JobPostingForm({ industries, initialJob, storageReady = false }: {
    industries: IndustryOption[];
    initialJob?: StoredJob;
    storageReady?: boolean;
}) {
    const locale = useLocale();
    const [values, setValues] = useState<Posting>(initialJob?.posting ?? emptyJobPosting);
    const [saved, setSaved] = useState(initialJob);
    const [dirty, setDirty] = useState(false);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState('');
    const [failure, setFailure] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [approvalReference, setApprovalReference] = useState('');
    const jobId = useRef(initialJob?.id ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [preview, setPreview] = useState<Posting | null>(null);
    const [changed, setChanged] = useState(false);
    const summary = useRef<HTMLDivElement>(null);
    const previewHeading = useRef<HTMLHeadingElement>(null);
    function update(field: Field, value: string) {
        setDirty(true);
        setMessage('');
        setFailure('');
        setConfirmed(false);
        setValues(current => ({ ...current, [field]: value }));
        setErrors(current => {
            const next = { ...current };
            delete next[field];
            if (field === 'salaryIsPublic' && value !== 'yes') {
                delete next.salaryMin;
                delete next.salaryMax;
                delete next.salaryPeriod;
            }
            return next;
        });
        if (preview) {
            setPreview(null);
            setChanged(true);
        }
    }
    function props(field: Field) {
        return { id: field, name: field, value: values[field], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(field, event.target.value),
            'aria-invalid': !!errors[field], 'aria-describedby': `${field}-hint${errors[field] ? ` ${field}-error` : ''}` };
    }
    function feedback(field: Field, hint: string) {
        return <><small id={`${field}-hint`}>{hint}</small>{errors[field] && <span className="job-field-error" id={`${field}-error`}>{errors[field]}</span>}</>;
    }
    function previewPosting() {
        const found = jobPostingErrors(values);
        setErrors(found);
        if (Object.keys(found).length) {
            setPreview(null);
            requestAnimationFrame(() => summary.current?.focus());
            return;
        }
        setPreview({ ...values });
        setChanged(false);
        requestAnimationFrame(() => previewHeading.current?.focus());
    }
    async function mutate(operation: 'save' | 'publish' | 'close' | 'archive' | 'restore') {
        if (pending || !storageReady)
            return;
        if (operation === 'save') {
            const found = jobPostingErrors(values);
            setErrors(found);
            if (Object.keys(found).length) {
                requestAnimationFrame(() => summary.current?.focus());
                return;
            }
        }
        if (!jobId.current)
            jobId.current = crypto.randomUUID();
        setPending(true);
        setFailure('');
        setMessage('');
        try {
            const response = await fetch(`/api/staff/jobs/${jobId.current}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operation, revision: saved?.revision ?? 0, ...(operation === 'save' ? { posting: values } : {}),
                    ...(operation === 'publish' ? { previewedRevision: preview && !dirty ? saved?.revision : null, confirmedGenuine: confirmed, approvalReference } : {}) }), signal: AbortSignal.timeout(12000) });
            const result = await response.json();
            if (!response.ok) {
                setErrors(result.fields ?? {});
                throw new Error(result.error ?? 'The change could not be confirmed.');
            }
            const job = result.job as StoredJob;
            setSaved(job);
            setValues(job.posting);
            setDirty(false);
            setPreview(null);
            setChanged(false);
            setConfirmed(false);
            setApprovalReference('');
            setErrors({});
            setMessage(operation === 'save' ? 'Draft saved. Preview this saved revision before publishing.' : operation === 'publish' ? 'Job published. It is available until its closing time, unless you close or archive it sooner.' : operation === 'close' ? 'Job closed and removed from public listings.' : operation === 'archive' ? 'Job archived and removed from public listings.' : 'Job restored as a draft. Review and approve it again before publishing.');
        }
        catch (error) {
            setFailure(error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError' ? error.message : 'The request could not be confirmed. Keep this page open; retry saving with the same posting, or reopen the saved posting to check its latest version.');
        }
        finally {
            setPending(false);
        }
    }
    const locked = saved?.status === 'closed' || saved?.status === 'archived';
    return localizeTree(<div className="job-editor-layout">
    <div className="job-editor-fields">
      <noscript><p className="notice">JavaScript is needed for this editor. No changes can be submitted without it.</p></noscript>
      {message && <p className="form-message" role="status">{message}</p>}
      {failure && <p className="job-error-summary" role="alert">{failure}</p>}
      {saved && <p className="fineprint"><a className="text-link" href={`/admin/jobs/${saved.id}`}>Open saved posting ↗</a> · Revision {saved.revision}</p>}
      {locked && <p className="notice">This job is {saved?.status}. Restore it to draft to edit or publish it again.</p>}
      <fieldset className="job-editor-editable" disabled={pending || locked}>
      {Object.keys(errors).length > 0 && <div className="job-error-summary" ref={summary} tabIndex={-1} role="alert">
        <h2>Check these details</h2><ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${field}`}>{message}</a></li>)}</ul>
      </div>}
      <fieldset className="job-editor-section">
        <legend><span>01</span> Role details</legend>
        <p>Use confirmed vacancy details. Fields marked * are required for a preview.</p>
        <div className="form-grid">
          <label className="wide" htmlFor="title">Job title *<input {...props('title')} maxLength={120} autoComplete="off"/>{feedback('title', 'The role candidates will see. Do not include personal contact details.')}</label>
          <label htmlFor="industrySlug">Industry *<select {...props('industrySlug')}><option value="">Choose an industry</option>{industries.map(industry => <option value={industry.slug} key={industry.slug}>{industry.name}</option>)}<option value="other">Other</option></select>{feedback('industrySlug', 'All four industries have equal standing.')}</label>
          <label htmlFor="location">Work location *<input {...props('location')} maxLength={160} autoComplete="off"/>{feedback('location', 'City and state, or the confirmed work area.')}</label>
          <label htmlFor="employmentType">Employment type *<select {...props('employmentType')}><option value="">Choose a type</option>{employmentTypes.map(type => <option key={type}>{type}</option>)}</select>{feedback('employmentType', 'Select the arrangement agreed for this vacancy.')}</label>
          <label htmlFor="experience">Experience <input {...props('experience')} maxLength={160}/>{feedback('experience', 'Optional. State only confirmed experience expectations.')}</label>
          <label className="wide" htmlFor="schedule">Shift or schedule <input {...props('schedule')} maxLength={240}/>{feedback('schedule', 'Optional. Include confirmed shift or working-day expectations.')}</label>
          <label className="wide" htmlFor="slug">Job URL slug *<input {...props('slug')} readOnly={!!saved?.published_at} maxLength={100} autoCapitalize="none" spellCheck={false} autoComplete="off"/>{feedback('slug', 'Lowercase letters, numbers and hyphens. The URL is fixed after first publication.')}</label>
        </div>
      </fieldset>

      <fieldset className="job-editor-section">
        <legend><span>02</span> Employer &amp; pay</legend>
        <p>Public details must match the agreed employment and payroll arrangement.</p>
        <div className="form-grid">
          <label htmlFor="employer">Employer display name <input {...props('employer')} maxLength={160}/>{feedback('employer', 'Optional. Enter only a company name authorized for public display.')}</label>
          <label htmlFor="payrollModel">Payroll arrangement <select {...props('payrollModel')}>{Object.entries(payrollModels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{feedback('payrollModel', 'Responsibilities depend on the signed arrangement.')}</label>
        </div>
        <label className="job-editor-check" htmlFor="salaryIsPublic"><input id="salaryIsPublic" name="salaryIsPublic" type="checkbox" checked={values.salaryIsPublic === 'yes'} onChange={event => update('salaryIsPublic', event.target.checked ? 'yes' : '')}/>Show confirmed pay in the job preview</label>
        {values.salaryIsPublic === 'yes' ? <div className="form-grid job-pay-fields">
          <label htmlFor="salaryMin">Minimum pay (INR) *<input {...props('salaryMin')} type="number" min="0" max="999999999" step="1" inputMode="numeric"/>{feedback('salaryMin', 'Whole rupee amount, approved for public display.')}</label>
          <label htmlFor="salaryMax">Maximum pay (INR) *<input {...props('salaryMax')} type="number" min="0" max="999999999" step="1" inputMode="numeric"/>{feedback('salaryMax', 'Must be at least the minimum amount.')}</label>
          <label htmlFor="salaryPeriod">Pay period *<select {...props('salaryPeriod')}>{Object.entries(salaryPeriods).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{feedback('salaryPeriod', 'The period both amounts cover.')}</label>
        </div> : <p className="fineprint">No salary amount will appear in the preview.</p>}
      </fieldset>

      <fieldset className="job-editor-section">
        <legend><span>03</span> Role expectations</legend>
        <div className="form-grid">
          <label className="wide" htmlFor="description">Role description *<textarea {...props('description')} rows={5} maxLength={5000}/>{feedback('description', 'Explain the role in plain text. Formatting code and HTML are not rendered.')}</label>
          <label className="wide" htmlFor="responsibilities">Responsibilities *<textarea {...props('responsibilities')} rows={5} maxLength={3000}/>{feedback('responsibilities', 'One responsibility per line.')}</label>
          <label className="wide" htmlFor="requirements">Requirements *<textarea {...props('requirements')} rows={5} maxLength={3000}/>{feedback('requirements', 'One relevant skill, qualification or eligibility requirement per line.')}</label>
          <label htmlFor="expiresOn">Closing date <input {...props('expiresOn')} type="date"/>{feedback('expiresOn', 'Required to publish. Closes at 23:59:59 India time on this date.')}</label>
        </div>
      </fieldset>
      </fieldset>
      <div className="job-editor-actions">
        <button className="button button-dark" type="button" disabled={pending || locked} onClick={previewPosting}>Preview job posting <span aria-hidden="true">↗</span></button>
        <button className="button button-outline" type="button" disabled={!storageReady || pending || locked || (!!saved && !dirty)} onClick={() => mutate('save')} aria-describedby="job-saving-notice">{pending ? 'Saving change…' : 'Save draft'}</button>
      </div>
      <p className="fineprint" id="job-saving-notice">{!storageReady ? 'Job storage is unavailable. Entries stay only on this page until saving is connected.' : dirty ? 'You have unsaved changes. Saving an edited published job takes it offline as a draft until reapproved.' : 'Drafts remain private. A saved draft needs a fresh preview and administrator approval before publication.'}</p>
      {saved && <div className="job-editor-actions" aria-label="Job status actions">
        {saved.status === 'published' && <button className="button button-outline" disabled={pending || dirty} onClick={() => mutate('close')}>Close job</button>}
        {saved.status !== 'archived' && <button className="button button-outline" disabled={pending || dirty} onClick={() => mutate('archive')}>Archive job</button>}
        {locked && <button className="button button-outline" disabled={pending} onClick={() => mutate('restore')}>Restore to draft</button>}
      </div>}
    </div>

    <aside className="job-preview-column" aria-label="Job posting preview">
      <div className="job-preview-status"><span className="job-status">{saved?.status ?? 'Not saved'}</span><span>{dirty ? 'Unsaved changes' : saved ? `Saved revision ${saved.revision}` : 'Not published'}</span></div>
      <p className="job-preview-announcement" role="status">{preview ? 'Private preview updated. This action does not publish changes.' : changed ? 'Details changed. Save and preview again to review your latest edits.' : 'Complete the role details, then preview the posting.'}</p>
      {preview ? <article className="job-posting-preview">
        <p className="eyebrow">Private preview · not a publication</p>
        <h2 ref={previewHeading} tabIndex={-1} data-original>{preview.title.trim()}</h2>
        <p className="job-preview-meta">{industries.find(industry => industry.slug === preview.industrySlug)?.name ?? 'Other'}<br /><span data-original>{preview.location.trim()}</span> · {preview.employmentType}</p>
        <dl>
          {preview.employer.trim() && <><dt>Employer</dt><dd data-original>{preview.employer.trim()}</dd></>}
          <dt>Payroll arrangement</dt><dd>{payrollModels[preview.payrollModel as keyof typeof payrollModels]}</dd>
          {preview.experience.trim() && <><dt>Experience</dt><dd data-original>{preview.experience.trim()}</dd></>}
          {preview.schedule.trim() && <><dt>Schedule</dt><dd data-original>{preview.schedule.trim()}</dd></>}
          {preview.salaryIsPublic === 'yes' && <><dt>Confirmed pay</dt><dd>₹{Number(preview.salaryMin).toLocaleString('en-IN')}–₹{Number(preview.salaryMax).toLocaleString('en-IN')} {salaryPeriods[preview.salaryPeriod as keyof typeof salaryPeriods]}</dd></>}
          {preview.expiresOn && <><dt>Proposed closing date</dt><dd>{preview.expiresOn}</dd></>}
        </dl>
        <h3>About the role</h3><p className="job-plain-text" data-original>{preview.description.trim()}</p>
        <h3>Responsibilities</h3><ul>{jobPostingLines(preview.responsibilities).map((line: string, index: number) => <li key={index} data-original>{line}</li>)}</ul>
        <h3>Requirements</h3><ul>{jobPostingLines(preview.requirements).map((line: string, index: number) => <li key={index} data-original>{line}</li>)}</ul>
        <p className="fineprint">Proposed path: /jobs/{preview.slug}</p>
        <p className="notice">Applications are unavailable. This preview has no public URL.</p>
      </article> : <div className="job-preview-placeholder"><p className="eyebrow">Before publication</p><h2>Clear details.<br />Confident decisions.</h2><ol><li>Confirm the vacancy and employer’s authorization.</li><li>Review location, payroll arrangement and role expectations.</li><li>Preview candidate-facing details before approval.</li></ol><p>No job listing is created by previewing this page.</p></div>}
      <div className="job-publish-gate">
        <label htmlFor="approvalReference">Approval reference<textarea id="approvalReference" value={approvalReference} onChange={event => setApprovalReference(event.target.value)} disabled={pending || !storageReady} maxLength={500} rows={3} aria-describedby="approval-hint"/></label>
        <p id="approval-hint">10–500 characters. Identify the vacancy authorization or approval record. Do not enter candidate data.</p>
        <label className="job-editor-check"><input type="checkbox" checked={confirmed} disabled={pending || !preview || dirty || !saved} onChange={event => setConfirmed(event.target.checked)}/>I confirm this is a genuine, authorized vacancy and I approve the saved details for publication.</label>
        <button className="button button-outline" type="button" disabled={!storageReady || pending || !saved || saved.status !== 'draft' || dirty || !preview || !confirmed || approvalReference.trim().length < 10} onClick={() => mutate('publish')} aria-describedby="job-publishing-notice">Publish job</button>
        <p id="job-publishing-notice">{storageReady ? 'Save, preview and approve the same revision. A confirmed payroll arrangement and future closing date are required. Public applications remain closed.' : 'Publishing is unavailable until job storage is configured.'}</p>
      </div>
    </aside>
  </div>, locale);
}
