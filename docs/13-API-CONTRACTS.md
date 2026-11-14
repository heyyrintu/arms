# 13 · Proposed API contracts (for Codex implementation)

These contracts are **specifications**, not working production endpoints. The three public POST routes currently return HTTP 503 intentionally. Do not mark implemented until the server validates, stores and acknowledges real submissions securely.

## Public job read
`GET /api/jobs?industry=...&location=...&q=...&page=1`
- Only active published jobs whose `expires_at` is NULL or in the future.
- Return minimal public fields; never expose candidates, source emails, private notes, admin IDs or internal client arrangements not approved for publication.
- Cursor/pagination or limit/page as selected. Cache safely; closing a job must invalidate public results.
- Success 200: `{ "items": [{"id":"uuid", "slug":"...", "title":"...", "industry":"...", "location":"...", "employmentType":"...", "salary":null}], "page":1, "hasMore":false }`.

## Employer enquiry
`POST /api/employer-enquiries` (multipart/form-data as current UI; may migrate to JSON with matching server/client change)
Fields: `company`, `name`, `email`, `phone`, `industry`, `headcount`, `location`, `payrollModel` (`arms|client|undecided`), `requirements`, `consent`.
- Authenticate? No, public route with strict validation/rate limit.
- Store normalized company/contact and company requirements plus privacy notice version and timestamp.
- Success: 201 `{ "referenceId":"uuid", "message":"Enquiry received" }` only **after committed storage**.
- Bad input 400/422 with non-sensitive field errors; too many requests 429; infrastructure error 503.

## General talent registration
`POST /api/talent-registrations` (multipart/form-data)
Fields: `name`, `phone`, optional `email`, `location`, `industry`, `preferredRole`, `experience`, optional `resume`, `consent`.
- Process candidate profile + talent network opt-in, optional private CV upload.
- Max file size 5 MiB, verify MIME/signature, extension, malware mitigation; do not return private path or upload URL to unauthorized clients.
- Success 201 with non-sensitive `referenceId`; no guarantee of placement.
- Duplicate phone/email matches may merge or remain separate according to approved candidate dedupe policy, never expose existing candidate details to public.

## Job applications
`POST /api/job-applications` (multipart/form-data)
Fields: `jobId`, `name`, `phone`, optional `email`, `location`, `experience`, optional `resume`, `consent`.
- Transactionally confirm job is `published` and not expired at time of submission.
- Prevent duplicate submission per approved candidate/job rules; return appropriate 409 or idempotent success without exposing other candidate data.
- Save application, candidate profile and optional document reference privately. Success 201 only on commit.
- Closed/expired job: 409 or 410 with accurate human-readable explanation.

## Proposed protected admin endpoints
Names are recommendations, adapt to chosen Next.js server actions/handlers while preserving capability.
- `GET/POST /admin/jobs` — list/create; `GET/PATCH /admin/jobs/[id]` — edit/status changes.
- `GET /admin/enquiries` + `PATCH /admin/enquiries/[id]` — status, ownership, notes.
- `GET /admin/talent` + `PATCH /admin/talent/[id]` — view/update within authorization scope.
- `GET /admin/applications` + `PATCH /admin/applications/[id]` — status, notes, assignment.
- `POST /admin/documents/[id]/download-ticket` — short-lived signed download after authorization/audit.
- `POST /admin/data-requests` — access/correction/deletion request workflow, authorized only.

## Critical mapping to suggested DB
- Form `company` → `employer_enquiries.company_name`.
- Form `name` → `contact_name` (employer), `full_name` (candidate).
- Form `industry` → `industry_slug` / `preferred_industry_slug`.
- Form `payrollModel` → `payroll_preference`.
- Form `requirements` → `role_requirements`.
- Form `experience` → `experience_text`.
- Form `jobId` → `job_applications.job_id`.
- Neither the browser nor unsecured clients may write to these tables directly.

## Nonfunctional requirements
Structured error shape, `no-store` for personalized/private responses, input size limits, audit logs without PII, rate limiting, no silent failures, safe retries, admin role checks, strict file access and secure retention/deletion.
