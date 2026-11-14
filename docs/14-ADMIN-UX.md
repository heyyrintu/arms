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
