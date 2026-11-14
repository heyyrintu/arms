# Private infrastructure verification — 15 November 2026

The owner authorized proceeding with private database/bucket integration and synthetic workflow checks. This increment applies the empty intake foundation and verifies actual infrastructure; **it does not deploy the website, enable real submissions or complete the full staging HTTP/scanner/email workflow**. Earlier docs/23–24 statements that migrations 008–011 remain unapplied are superseded by this record.

## Applied database increment

Applied the unchanged, reviewed source files `008_intake.sql` through `011_internal_notifications.sql` to the dedicated ARMS PostgreSQL database through the existing loopback-only SSH tunnel. Their SHA-256 hashes are recorded in `arms_intake.schema_migrations` and match the local sources. Historical migration files were not edited. The original public-schema proposal 001 remains unapplied.

Created four distinct non-owner logins: submitter, reviewer, CV processor and internal notifier. They are NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS/NOINHERIT, connection-limited, with bounded statements/idle transactions. Actual credential-based connections succeeded for all four. Tests verified denied staff-password/audit access, no contact reads for submitter/processor/notifier and safe reviewer privileges, including inherited/column grant checks.

`scripts/setup-intake-database.mjs` is a fresh-only operator tool: default is a no-network plan; apply refuses existing roles/schema/configuration. It writes a private ignored pending configuration and syncs it **before** attempting COMMIT, then atomically replaces the local `.env` after success. An uncertain commit preserves the pending credentials for operator recovery rather than blind rerun. No credentials are printed. Successful setup left `.env` mode 0600, no pending file, and all saved staff/review/download/notification flags false. Runtime URLs use the local SSH tunnel; do not copy them into a deployed container.

## Actual PostgreSQL rollback-only workflow

`scripts/check-intake-database.mjs --ssh-tunnel --rollback-workflow` verified the real restricted roles and all three purposes: employer enquiry, Career profile and specific-job application; identical retry; audited detail read/status changes; private synthetic document metadata/download and queued notification claims. It used the existing administrator ID as an **operator-controlled fixture authorization callback**, not a staff browser session or authentication bypass in the app. Each operation ran under the appropriate restricted database role.

All service transactions were mapped to savepoints inside one outer transaction, then the outer transaction was rolled back. Separate real restricted connections could see neither the synthetic vacancy nor submission rows. The checks created no committed fictional job or applicant record. Final counts are zero for jobs, job activity, intake records, document metadata, intake activity, document-access events and outbox. The existing staff account was unchanged.

The file store, scan verdict and notification sender for this transaction were memory stubs. No real applicant CV, engine scan or SES delivery is claimed by that workflow. Actual bucket and SES simulator checks were separate, as described below. This is not a complete authenticated owner/browser test against the live infrastructure.

## Actual Lightsail bucket round trip

`scripts/check-storage-instance.mjs --synthetic-roundtrip` ran the exact object-storage adapter body in a temporary official Node container on the already attached Ubuntu-1 instance. The container was unprivileged, root read-only, had a temporary writable filesystem, resource limits and no published ports or permanent bucket keys. It used instance credentials; no staff/SES/database credentials were passed into it. The official Node image was pinned to the digest observed during its initial pull. The image remains cached; the diagnostic container exits with `--rm` and is not an application deployment.

The first attempt stopped before any bucket operation because npm's cache was outside the writable temporary directory. Correcting the cache path allowed the probe to pass without weakening the container permissions.

Verified on one random-key **synthetic PDF containing no personal data**:

- Authenticated bucket access and conditional upload succeeded; repeat upload was rejected with precondition failure.
- Download length and SHA-256 matched exactly.
- AWS reported AES256 server-side encryption for the object; its ACL had no public grants.
- An unsigned request for the known uploaded object returned HTTP 403.
- Deletion succeeded; the current object was unavailable afterward. The exact random key's versions/delete markers were checked and removed. No other bucket object was read or changed.

The test object returned no version ID. This is scoped evidence for the test key, not a claim about every existing bucket object or the global future versioning/lifecycle policy. Bucket permissions, firewall, CORS and instance attachments were not changed. Retention/version/backup deletion operations still need complete implementation and sign-off.

## SES and scanner status

The existing send-only SES configuration accepted a new message to AWS's success mailbox simulator. No real person received mail, no OTP or applicant data was sent, and no IAM permission changed. This confirms provider API acceptance for the simulator, not applicant acknowledgements, inbox delivery or end-to-end notification worker operation. Saved notification delivery remains disabled and the real outbox is empty.

Read-only VPS checks found 3,832 MiB total RAM and approximately 1,803 MiB available, with existing swap use and several running services. The [official ClamAV requirements](https://docs.clamav.net/) recommend 3–4 GiB for the standard signature database. Installing/running a scanner under this observed headroom risks existing services. No scanner, service restart, resize, purchase or new public port was performed.

The owner has been asked to choose an adequately sized existing server, increase this VPS's capacity, or keep scanning blocked. `ops/private-scanner/README.md` and `clamd.conf` provide the reviewable host/configuration plan, including private Unix socket permissions, bounds, signature freshness and worker requirements. If another host is selected, co-locate the scan worker with its Unix socket and obtain separately reviewed narrow bucket/DB access; a host name alone is not permission to grant another instance access. No remote unencrypted clamd socket is proposed.

## Files, tests and current gates

New operator tools: fresh setup, restricted DB/rollback verification and instance storage round trip. Package commands: `db:intake:setup`, `check:intake-database`, `check:storage:instance`. The existing hash-only plan command remains non-mutating. Three new tooling tests verify no-action defaults, no secret output and unchanged local configuration.

Final checks: 64 unit/database/helper tests, 11 production-preview HTTP checks, typecheck, zero-warning lint, production build, handoff and migration-hash plan pass. Browser bundles were checked against configured secrets with no matches. No UI changed in this increment, so no new browser screenshot is claimed. The local preview still shows inert public forms, no-index and protected staff routes. Test preview and SSH tunnel are stopped after verification.

Still open: scanner host/capacity decision and actual engine/worker setup; complete private authenticated HTTP/file linkage tests; applicant acknowledgements; trusted proxy/bot/body bounds; assignment-based recruiter access; legal holds, rights and retention/deletion/backup operations; owner/legal privacy and language approval, real content and every docs/10 deployment gate. The next required owner input is the scanner-host choice already requested. Nothing is marked launch-ready.

Follow-up: the owner chose the existing VPS. Docs/26 records the bounded, installed private scanner and successful real engine/maintenance tests. The earlier scanner-host-choice blocker is resolved; full app/worker/retention/privacy and launch gates remain open.
