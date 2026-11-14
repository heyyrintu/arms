# 14 · Protected admin experience (to be built)

The public website is not a payroll platform. Admin v1 manages **jobs, leads and candidate pipelines**, not payroll execution or worker salary slips.

## Layout
Simple high-contrast operational interface, not the marketing homepage. Use ARMS identity minimally (deep teal/ivory), prioritize tables, status, search and secure access. Admin uses database-backed staff sign-in, server-side role checks and an email code required in production. Email codes are an additional verification step, not phishing-resistant or NIST-assured MFA. No public self-registration is allowed.

## Menu
Dashboard · Jobs · Applications · Talent Network · Employer Enquiries · Activity (admin-only) · Settings (admin-only).

## Roles
- `admin`: manage authorized admin users, job publications, company workflow settings, privacy operations, access audit; least privilege still applies.
- `recruiter`: read assigned candidates/applications, update recruitment status and job drafts as explicitly authorized, never manage users or application secrets.
- `business_development`: view assigned employer enquiries, not candidate CVs by default. This additional role is optional but recommended.

## Key views
**Jobs:** draft/published/closed/archived tabs; title, industry, location, payroll model, publish & expiry, role requirements, official approvals. Preview required. Publishing never allowed without required metadata.

**Applications:** application id, job, candidate contact (masked in broad lists), received time, status, assigned recruiter, safe internal notes. Documents only through privileged download ticket.

**Talent network:** search/filter by industry, role, location, date, last consent, retention. Candidate merge/deletion review with audit.

**Employer enquiries:** company, role, headcount, location, preferred payroll model, owner, status, last follow-up. Notes and flags, no false promise of staffing availability.

## UX states
Meaningful success/error/toast, confirmations for closing job, no irreversible delete without authorized review, pagination, minimal export and masked columns. Data updates should survive refresh and use server-side permissions.

## Post-MVP only
Employer dashboard, candidate login, real-time attendance, pay slip portal, automated HR screening and complex rostering. These belong in a separate discovery effort and should not delay MVP.

## Add job posting UI — 14 November 2026

**Later status:** the owner authorized connecting storage/lifecycle after this UI increment. Saving, reopening, approval/publication, close/archive/restore and activity are now implemented with isolated jobs permissions; the unavailable-save description below is historical. See docs/21 for the current workflow, verification scope and remaining owner review.

At the owner's request, the staff workspace now provides **Job postings → Add job posting** for the `admin` role. `/admin/jobs/new` independently checks the live staff session and `admin` role on the server before rendering the editor, and fails closed to sign-in. Recruiter draft-edit access is not yet granted; other staff workflows are unchanged.

The editor has role title, URL slug, equally presented industry choices (no default sector), location, employment type, experience/schedule, optional authorized employer display name, both payroll models or contract confirmation, optional public INR pay range/period, plain-text description, line-separated responsibilities/requirements and an optional future closing date. Preview checks required fields, bounds, safe slug shape, enums, ordered whole-rupee amounts and valid future dates. It focuses a linked error summary or the resulting preview heading and marks field errors accessibly. Text is rendered escaped; changing a value removes the stale preview. Hidden pay does not appear in the preview.

This increment is **UI only**: Save draft and Publish job are disabled with adjacent explanations. Page-memory entries are lost on navigation/reload, and no browser storage, form submission, API mutation, database migration or public listing is introduced. There is no fake saved/published acknowledgement. Future write endpoints must recheck server authorization, validate independently, enforce slug uniqueness and approval/publication/expiry invariants, and audit committed changes.

The exact client component was tested in an isolated loopback-only review harness with synthetic labelled data and no database/authentication connection. The actual Next route was checked for anonymous redirect and private/no-index headers. Authenticated navigation into this new route was not repeated with the owner's credentials in this increment. Responsive measurements at 320/360/768/1050/1440px found no horizontal overflow; label associations, error-summary focus, preview-heading focus, hidden salary and plain-text escaping were checked. This is not a completed human screen-reader/accessibility audit. Evidence: `artifacts/qa/admin-job-editor-desktop.png` and `artifacts/qa/admin-job-editor-mobile.png`.
