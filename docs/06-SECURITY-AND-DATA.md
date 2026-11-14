# 06 · Backend, data and security specification

## Proposed architecture
Next.js App Router, server-only handlers/services, PostgreSQL, authenticated admin, private file storage, delivery provider for transactional acknowledgements, rate-limit service for public forms. Integrations are **not connected in this starter**. The owner selected PostgreSQL on a Coolify-managed Lightsail VPS, private Lightsail object storage and database-backed staff passwords with production email verification through Amazon SES. This supersedes the earlier Auth0 selection. Bucket instance access is configured; staff database setup and SES readiness remain gated. See `18-BACKEND-INTEGRATION-PLAN.md`.

## Data categories
- Job: id, slug, title, industry, location, schedule, employer/payroll model, salary disclosure fields (nullable), content, status, publish/expiry timestamps.
- Employer enquiry: company/contact, industry, headcount, shift/location, payroll preference, notes, privacy notice version, submission state, assigned operator.
- Candidate: name, phone, optional email, location, preferences, experience, consent record, retention fields.
- Application: job link, candidate link, status, timeline and optional private CV metadata.
- Admin activity: actor, action, time, object id, minimal metadata (avoid dumping PII into logs).

## Database
`database/001_initial.sql` is an initial Postgres schema suggestion. Review ownership, indexing, authorization, retention and provider-specific row-level security before migrations. Do not expose direct client writes into sensitive tables.

## Authorization
- Public read: **published and unexpired jobs only**, through limited server queries.
- Public write: server-mediated validated submits only. Do not allow direct table access, job edits or candidate reads.
- Admin: server-enforced role checks for every read/write, not only by hiding UI links.
- Admin should have MFA and short-lived sessions; record privileged mutations. Separate recruiter-only visibility from all-purpose admin.
- Service-role/database credentials must never be client exposed or logged.

## Validation and anti-abuse
- Validate all fields again on server (Zod or similarly maintained library), not only browser `required`.
- Normalize phone/email; reject invalid sizes and unknown enum values.
- CSRF/origin/host considerations according to chosen auth architecture; bot protection and per-IP/per-identity rate limiting for public endpoints.
- Parameterized queries, output escaping, no arbitrary HTML, no client-controlled file paths.
- Enforce upload **5 MB maximum** (or stricter after review), MIME **and** extension/signature validation, random filenames and private storage. Virus scan uploaded documents where practical.
- Use signed short-lived file download URLs; never expose public CV bucket URLs.
- Server responses must not leak PII, SQL errors, secrets, or internal stack traces.

## Privacy & retention — owner/legal sign-off required
- Finalize lawful notice before accepting information; name responsible legal entity, purposes, contact, data recipients/processors, retention schedule, rights and requests mechanism.
- Keep employer sales and candidate recruitment purposes distinct. No default marketing subscription.
- Implement deletion/retention workflows for registrations, applications and CVs; limit access and log reads if sensitive.
- Avoid scraping external applicants, capturing unnecessary IDs, collecting financial information or sensitive profile attributes in MVP.
- Verify applicable Indian employment, privacy, labor, payroll and statutory rules with qualified advisors, based on actual contracts and operational jurisdiction. This file is not legal advice.
- Confirm vendor region, cross-border transfer provisions and incident response.

## Emails/notifications
Use a verified sending domain/provider. Only send after successful save; apply rate limits; ensure mail templates contain minimal PII. Do not claim sent if provider rejects. Escalate provider failures for retry without duplicate data.

## Operational posture
Backup and recovery plan, secret management, principle of least privilege, review logging, updated dependencies and vulnerability scans, environment separation, cache exclusions for personal data, HTTP security headers/CSP, HTTPS, regular access reviews.
