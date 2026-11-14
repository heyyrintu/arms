# Private CVs, staff review and internal notifications — 15 November 2026

The owner authorized the next development increment after the isolated intake foundation. This implements protected review routes and the private document/notification service code. **It does not enable public collection, deploy the app, apply hosted migrations or establish production readiness.** Only synthetic records/files in ephemeral PGlite and a memory object store were used.

## Review screens and request protection

- `/admin/intake/employer`, `/admin/intake/talent`, `/admin/intake/application`: reference/status/time lists, latest 50, no contact details. Honest empty/unavailable states, employer/Career/application navigation and English/Hindi UI.
- `/admin/records/[id]`: independently authorizes a live administrator before loading a record. Shows escaped submitted details, the original notice/consent, separate future-role choice and purpose deadlines. Authored personal text is preserved in its entered language.
- `components/IntakeReview.tsx` and `IntakeActions.tsx`: shared views, revision-checked human status changes and explicit save/error/download acknowledgements. No automatic scoring, rejection, exports or candidate decision email. Recruiter/business-development access remains denied until assignment-based permissions exist.
- `/api/staff/intake/[id]`: POST-only; checks configured staff origin and cross-site metadata, authorizes before parsing, bounds JSON to 1 KiB, rejects unknown keys and returns only committed status/revision. It does not return payloads.
- `/api/staff/documents/[id]/download`: POST-only, same origin/live admin checks, attachment-only PDF response, no-store, no-referrer, nosniff and sandbox CSP. At most two concurrent object downloads per app process. This authenticating proxy returns no public or signed bucket URL. It rechecks authorization and parent retention after retrieval and commits a document-access audit before returning bytes.
- `lib/server/intake.ts`: server-only restricted reviewer pool; refuses owner/elevated/member, credential, contact-update, audit-write or document-promotion privileges. Runtime guard is tested with actual isolated grants, including column-level access and inherited elevated membership. A catalog/OID check avoids requiring schema access merely to test denied job/staff privileges.

Flags default false: `INTAKE_REVIEW_ENABLED`, `PRIVATE_CV_DOWNLOADS_ENABLED`, `INTERNAL_NOTIFICATIONS_ENABLED`. Reviewer, scan worker and notifier credentials are separate server-only configurations. No credentials or flags in the ignored local `.env` were changed. The new screens redirect anonymous users while saved staff auth remains disabled.

## Private document processing

`lib/intake/documents.mjs` provides the internal processor and authorized review logic. No public upload endpoint is exposed and the three public submission handlers remain unchanged 503 responses without parsing bodies. The inert form preview now accurately describes the implemented file allowlist: **optional PDF, at most 5 MiB**. DOC/DOCX are rejected at this increment rather than accepted without their own validation.

Validation checks extension, MIME, bounded bytes, PDF header/EOF and conservatively rejects visible encryption/script/launch/attachment/action markers. This is not a full PDF parser or a claim that arbitrary PDFs are safe. Every accepted document still requires the scanner. Original names are not stored or used as object keys; keys are random `quarantine/<record UUID>/<document UUID>.pdf`, with SHA-256 and size in metadata. Employer enquiries cannot attach CVs. One document per record; replacement needs a separately reviewed workflow.

Metadata is written **before** the object, so interrupted/uncertain writes have a cleanup record. No pending/rejected/failed file can download. A clean verdict promotes the row only while still pending. Errors fail closed; non-clean objects are removed when possible, and failed deletion remains tracked. Cleanup atomically marks stale pending work failed before removal, preventing late scanners from promoting deleted objects; clean files are excluded. This cleanup method is not yet scheduled or production-monitored.

`lib/intake/s3-storage.mjs` uses the existing SDK/private bucket configuration. It sends no public ACL, writes conditionally to prevent overwrite, includes a SHA-256 checksum and returns no URLs. Download reads are size bounded and the review service verifies the entire digest before releasing a file. No real bucket put/get/delete was performed. Lightsail compatibility of conditional writes/checksums, attached-instance credentials from the actual container, account/bucket public-access restrictions, encryption configuration and lifecycle/version behavior still need private staging verification.

`lib/intake/clamav.mjs` streams bounded bytes over a local Unix socket with framed INSTREAM chunks, backpressure cancellation, deadline and bounded reply. Only an exact explicit clean response is accepted; infected, error, incomplete, oversized or timed-out results never become clean. Scanner output is not logged. This follows the [official ClamAV protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html). The adapter was tested against synthetic Unix-socket fixtures, **not a deployed scanning engine or production signature database**. ClamAV/freshclam installation, monitored fresh signatures, PDF scanning, limits, encrypted/limit-exceeded alerts, socket permissions, capacity and worker concurrency need operational configuration. Do not enable uploads based only on these adapter tests.

Prepared migration `010_private_documents.sql` adds metadata/access audit and separate processor grants. It does not create a login or change the hosted DB/bucket. Reviewer cannot promote scan status; processor cannot read saved contacts, staff credentials or access audit. Versioned object erasure and clean-purpose retention deletion are still separate pending work; deleting a current key alone must not be claimed to purge historical versions or backups.

## Internal notifications

Prepared `011_internal_notifications.sql` and `lib/intake/notifications.mjs` add leased queue claims, bounded attempts and delayed retries. A separate notifier reads only reference/kind, not saved contacts or CVs. The queue item becomes sent only after the sender adapter confirms provider acceptance. A failed/uncertain send remains retryable; exhausted work stays failed for operator attention. SES can produce duplicate notifications after an uncertain outcome: there is no exactly-once email claim.

`scripts/send-intake-notifications.mjs` / `npm run notify:intake` defaults to a no-network disabled result. An eventual reviewed operator must explicitly configure the restricted notifier role, SES and approved staff target and pass `--send-internal`. Batches are bounded to ten. Messages contain a reference/kind only, no applicant names, phone, email, CV or untrusted user-authored text. Current staff SES permissions were not expanded and no email was sent. Applicant acknowledgements and candidate decision emails remain unimplemented; they need approved templates/recipient authorization and delivery/privacy review.

## Verification evidence

Initial install/typecheck/lint/build passed. SQL and service tests use temporary isolated PGlite; object tests use a memory store or SDK command stubs. Tests cover type/size/path checks, clean/rejected/failed scanning, tracked cleanup/retry, late-scan race, integrity mismatch, wrong role, revoked session, missing/withdrawn/expired parent, audit failure, reviewer/processor grants, restricted runtime guard, bounded object reads and notification failure/leases/exhaustion. Unix-socket tests verify actual INSTREAM framing and fragmented/error/timeout replies, using no malware or real CV.

Browser checks used the exact shared components and actual review/document services in a separate loopback-only Next fixture, isolated synthetic administrator/records/PGlite and memory file store. No real login session was created. Confirmed persistent status save and acknowledgement, private synthetic PDF download acknowledgement, English/Hindi, masked lists, empty/unavailable states and one h1/no horizontal overflow at 320/360/768/1440 widths (16 measurements). A status message lost on revision remount was found and fixed; select labeling and download-specific loading copy were improved. This is not an authenticated owner test of the real Next mutation/download handlers against hosted integrations. Full human screen-reader/accessibility review remains open.

Evidence: `artifacts/qa/intake-review-desktop.png`, `artifacts/qa/intake-review-hindi-mobile.png`. The fixture's explicit synthetic banner is not part of the product. No fake-auth/fixture routes were added to the real app.

## Remaining work before collection

1. Reviewed private staging, apply prepared 008–011 with separate restricted roles and verify actual grant/transport checks; configure app origin/HTTPS and container bucket credentials. No hosted changes have been made in this increment.
2. Install/operate the private scanner and cleanup/notification workers, verify real Lightsail SDK behavior, quarantine denial and restore/failure handling with synthetic files.
3. Complete bounded multipart intake/file linkage, trusted proxy IP and real bot protection, idempotent combined data/file retries, applicant acknowledgements and full staging flows. Public forms remain disabled, not an alternate way to invoke the new processor.
4. Complete notes/assignment-based recruiter access, pagination/search, rights handling, job-close/expiry propagation, legal holds, independent-purpose retention/deletion/version/backups and incident operations.
5. Owner/legal privacy and language approval, operating jurisdiction/age assumptions, genuine vacancies/company particulars, owner authenticated review and every docs/10 launch sign-off.

The next owner input is operational approval of the private staging/scanner setup when that concrete host plan is ready; no passwords or CVs are needed in chat. There is no launch-ready or legal-compliance claim.

Final verification: 61 unit/database/helper tests and 11 production-preview HTTP checks pass; typecheck, zero-warning lint, build, handoff validation, read-only migration plan and disabled notification CLI check pass. Browser JS assets were compared with configured secret values with no matches; ignored local configuration remains mode 0600. No live CV/scanner/email delivery is claimed. The temporary fixture and production test servers were stopped after verification.

Subsequent infrastructure verification: docs/25 supersedes the “008–011 unapplied” status. The empty schema/restricted logins are now applied; actual rollback-only DB and synthetic instance-bucket checks pass. Scanner capacity/host selection and full authenticated/applicant-delivery flows remain pending; collection stays disabled.
