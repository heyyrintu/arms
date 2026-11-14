# Forms milestone: isolated intake foundation — 15 November 2026

The owner authorized moving past the visual refresh into the next implementation step. This increment prepares the server schemas, transactional saving and authorized review logic for employer enquiries, Career profiles and applications. **Milestone 3 remains incomplete.** No public route imports this service; forms remain disabled and their POST routes return 503 without parsing personal data. No hosted migration, candidate record, CV upload, email or deployment was performed.

## Implemented files and behavior

- `lib/intake/validation.mjs`: strict known-field/type/length/enum validation for all three purposes, Unicode/Hindi names, four equal industries, normalized email and explicit international phone country codes. It rejects old notice versions, absent consent, string-valued consent/optional opt-in, unknown fields and uploaded-file/path fields. No country code is guessed. Future form adapters must explain the country-code requirement accessibly in both languages.
- `lib/intake/policy.mjs`: shared draft version/status and calendar-month retention calculation with UTC time preservation and month-end clamping. `content/privacy.ts` imports that version/status so the displayed draft and validator share one source. This is not privacy approval.
- `lib/intake/service.mjs`: disabled by default; requires an explicitly approved server-side policy, a strong HMAC key, trusted network identity and an injected abuse verifier before saving. Tests inject an approved **synthetic fixture policy**, not approval of ARMS's draft. There is deliberately no environment switch, production adapter or web endpoint for this service yet.
- `database/008_intake.sql` and `009_intake_grants.sql`: **prepared and tested only in ephemeral local PGlite**, not applied to the dedicated hosted database. They use isolated `arms_intake` and review the suggested 001 model rather than applying it wholesale. Staff/jobs schemas are prerequisites. Separate non-owner submitter/reviewer logins must eventually be provisioned by an operator.
- `tests/intake.test.mjs`: isolated fixtures for validation, gates, storage/retry, job state, permissions, audited reads/status changes, retention dates and failure rollback.
- `npm run db:intake:plan`: read-only file hashes; deliberately refuses apply flags. It does not read credentials or open a database connection.

## Saving, privacy and permissions

A random client retry UUID is HMACed; a separate HMAC binds it to the canonical purpose, notice and normalized payload. Advisory transaction locks plus a unique constraint serialize the same retry token. An identical retry returns only the committed opaque reference; changed content using that token conflicts. The service never looks up or discloses an existing person by phone/email. Different retry IDs remain separate submissions: approved cross-submission deduplication/merge rules are still open.

A job application verifies and share-locks an approved published job, then checks availability again in the INSERT statement; a close/edit cannot race that transaction. A retry of an already committed receipt remains valid after closure. New applications to draft, closed, expired or unknown jobs fail. Real concurrent network/database-process and expiry-boundary tests are still required; PGlite tests verify sequential behavior, constraints and grants.

Each record stores notice version and consent time. General Career contact is explicit; a job application does not automatically opt in to future roles. Optional future-role consent remains independent of the application. No marketing consent or automated scoring/rejection is added.

Submitter grants allow insertion and reading only reference/retry hashes, **not stored payloads or contacts**. It has no job-write, staff, audit, delete, truncate or DDL access. Reviewer grants allow selected record columns and narrow status/clock updates, but no retry hashes, personal-data editing, audit mutation or credential access. Both credentials are intended exclusively for server processes, never browsers or anonymous SQL clients. No logins/credentials were created by this increment.

Every review operation re-authorizes an administrator before using storage. Recruiter and business-development roles are denied until assignment-based permissions are built. Broad lists show at most 50 reference/kind/job/status/revision/time rows without contact details; pagination/filtering UI is not built. Detail reads require a successfully committed minimal audit event before returning personal data. A database function independently checks that the actor is an active administrator for detail audit and status changes. Status changes lock the record and require the current revision; stale/invalid transitions fail. Owner-controlled triggers audit received/status events in the same transaction. Logs contain IDs/actions/time, not payloads or contact snapshots.

Durable per-hour global (100), network (10) and identity (5) attempt budgets use HMAC keys and commit outside submission transactions, so failures count across instances. These initial conservative budgets require operational tuning. The future request adapter must obtain the actual client IP through a reviewed trusted proxy setup; arbitrary posted/forwarded addresses are not acceptable. A real bot verifier, endpoint-origin checks, streaming body/file bounds and expiration/cleanup of rate-limit keys are not implemented here.

## Acknowledgements and retention scope

Saving also inserts a reference-only pending internal notification into an outbox in the same transaction. Outbox/audit failure rolls back the record. A receipt means **stored**, never “email sent.” There is no worker, delivery attempt, applicant email permission or queue-sent claim yet. The existing SES policy remains limited to staff mail destinations and was not broadened.

Initial employer/Career purposes get 24 calendar months. An application starts its separate 12-month clock on a recorded terminal decision/withdrawal/closure; an optional Career purpose retains its separate original 24-month date. Ordinary views/status changes do not silently renew future-role consent. Withdrawn standalone Career records and fully expired records are excluded from routine review. These clocks are conservative preparation, not full retention enforcement.

Still required: job-close/expiry propagation to ongoing applications, independent-purpose recruiter search/expiry handling, verified withdrawal/correction and privacy-operator access, meaningful employer-interaction renewal, legal holds/minimums, monitored eligibility/deletion jobs, object/version deletion, backups/restoration and processor deletion. No automatic deletion or legal-compliance claim is made. No CV metadata/storage integration is included yet; all file/path fields are rejected rather than accepting unscanned documents.

## Verification and current blockers

Dependency installation initially lacked TypeScript compiler files. Reinstallation from the existing lockfile repaired the dependency tree; versions were not intentionally changed. Typecheck and lint pass. The read-only migration plan also passes. All 48 unit/database/helper tests pass, including 12 new intake tests. The full unit suite requires local loopback permission for its existing first-administrator setup test; its initial restricted run failed only on that permission and the permitted run passed.

The current repository has a Git directory (contrary to the earlier handoff's historical note) and many pre-existing changes. The two supplied `public/brand` WebP marks and all seven `references` PNGs are currently deleted. Build fails on the missing wordmark import; handoff validation reports the missing marks/references. Owner confirmation to restore the exact saved originals is pending. No branding replacement or unrelated worktree changes were reverted. Browser/production-preview checks for this increment are not claimed complete while the build is blocked. There is no UI change in this increment.

## Next increment / owner requirements

Continue with quarantined private CV storage and a real scanner/cleanup path, restricted production adapters, the notification worker with narrowly reviewed SES access, and protected review screens with bilingual states. Then verify the complete workflows in private staging before considering collection. Production privacy/legal approval, jurisdiction/age assumptions, retention/deletion/backup operations, trusted app origin/network, real approved vacancies and every docs/10 sign-off remain required. The owner currently only needs to resolve the missing-original-assets question; no passwords or keys are requested in chat.

## Original assets restored — 15 November 2026

After the owner explicitly approved restoration, all nine missing original files (two optimized marks and seven reference PNGs) were restored byte-for-byte from HEAD. No existing file was overwritten. The earlier build/handoff blocker above is resolved: typecheck, lint, production build and handoff validation pass. All ten HTTP preview safety tests also pass against a loopback-only production server with jobs reads and staff auth disabled. No public submission, hosted mutation or deployment was enabled. This asset restoration introduced no UI redesign.

Follow-up implementation: docs/24 supersedes the earlier “CV services/review screens not built” scope notes with prepared, isolated-tested CV/review/internal notification code. Real bucket/scanner verification, public upload linkage, applicant email and operational privacy/retention gates remain open.
