# 05 · Functional user journeys & states

## A. Employer lead: `/hire-workforce`
1. Arrive from hero, solutions page, industry page, header or footer.
2. View credible summary, optional service/payroll explainer.
3. Fill company, contact, email, phone, industry, roles, headcount, location, shifts/requirements, payroll preference (`arms`, `client`, `undecided`).
4. See clear privacy notice and required acknowledgement checkbox; avoid marketing opt-in conflation.
5. Submit. Server validates, rate-limits, stores transaction, routes to authorized internal staff, and returns a reference ID/verified acknowledgement. On failure: truthful error, no fake success.
6. Internal status: `new` → `contacted` → `qualified` → `proposal` → `won`/`closed` (adjust with operator).

## B. Live job discovery: `/jobs`
1. View only active approved published jobs; client filters by keyword, location, industry, job type, confirmed salary metadata if available.
2. Open role. Show title, location, work arrangement, verified employer/payroll arrangement when permitted, experience, pay if approved, shifts and role expectations.
3. Apply *without account*; optionally attach resume up to 5 MB in accepted type, with server-side checks.
4. Get honest on-screen + optional email/SMS acknowledgement; save application only once, avoid accidental duplicates.
5. When no matching roles, show genuine empty state and CTA to join talent network.
6. No public application form for closed, expired, draft or sample jobs.

## C. General talent registration: `/talent-network`
1. Candidate gives name, mobile, current location, interested industry/role, relevant experience, optional email and CV.
2. Candidate reviews clear notice and scope of potential future contact.
3. If backend/privacy integration approved, store securely with timestamp and policy version, send confirmation when supported.
4. Provide correction/deletion request channel and application follow-up guidance.

## D. Candidate support
Route job application questions versus employee/payroll questions. Identify correct employing party and escalation channel; avoid promising that ARMS administers client payroll for all workers.

## E. Admin operations (to implement)
- Admin login (managed auth, MFA ideally), minimum `admin` and `recruiter` roles.
- Job editor with draft/publish/close/archive, preview, safe slug, expiry and explicit company authorization.
- View/filter inbound applicants, talent registrations and employer leads with least-privilege access.
- Internal notes, assigned staff, statuses, audit trails and deletion/retention controls.
- No employer public portal or candidate account required in MVP.

## States to implement and test
Default, loading, empty, field validation error, server error, offline/timeout, duplicate submission, successful saved submission, unauthorized/forbidden, closed job, expired consent or missing consent, upload rejection (size/type), accessible success notification.

## Current preview behavior
`LeadForm.tsx` renders a server-side, disabled fieldset, with no form action or submission handler. Personal details and CVs cannot be entered in any mode. The approved privacy notice and secure integrations must exist before this is replaced with an active form. API routes still return 503 without reading the body. Sample jobs are restricted to development, visibly labelled, and cannot be applied for; production sample URLs return 404.
