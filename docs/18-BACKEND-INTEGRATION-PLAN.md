# Selected backend — 14 November 2026

**Job integration update:** the owner subsequently authorized the job workflow. Isolated jobs migrations 004–006, restricted writer/reader, approved public view and job lifecycle are implemented/applied; no real vacancies have been supplied or published. Original applicant schema 001 remains unapplied. The earlier job-integration next steps below are historical; see docs/21 for current evidence and remaining owner/production review.

## Current owner decisions and verified state

- PostgreSQL 18 runs as `armc-db` on a **Lightsail VPS** managed by Coolify. The Coolify control panel/`localhost` server is a different **Hostinger VPS**.
- The owner confirmed this is a dedicated ARMS website database and explicitly approved the staff-authentication setup. Migrations `002_staff_auth.sql` and `003_staff_runtime_grants.sql` were applied in isolated schema `arms_auth`. A separate `arms_staff_runtime` login was created and tested; it cannot modify staff credentials/roles or create objects in the staff schema. The owner has now created the first administrator account by entering their password privately; no applicant tables or records were created.
- The owner replaced the earlier Auth0 choice with PostgreSQL-backed staff login IDs and password hashes, plus an email code required in production. Auth0 is not installed or required. Amazon SES is the chosen email provider; sender is `noreply@armstalentpartners.com`.
- The Lightsail bucket `arms-people-solutions` in Mumbai is configured **All objects are private**. After specific owner approval, `Ubuntu-1` was attached for credential-free instance resource access. No permanent bucket key was created. No CV/object was uploaded, read or deleted.
- The approved send-only IAM policy and arms-staff-ses identity/key are now configured; an AWS mailbox-simulator send was accepted. The confirmed first-admin login/email is info@armstalentpartners.com. Its SES recipient verification is confirmed; the owner entered their password privately and account creation is confirmed. Saved staff-auth configuration remains disabled. A temporary one-hour development process enables it only on loopback with email verification required for the owner’s end-to-end test. Public employer/candidate APIs still return HTTP 503 without parsing/storing personal data. No website deployment or launch sign-off has occurred.

## Database connection and permissions

The original bootstrap `DATABASE_URL` is ignored and remains separate from `STAFF_DATABASE_URL`. The restricted staff URL and a generated HMAC secret are stored only in the ignored local `.env`, with mode 600. No secret uses a `NEXT_PUBLIC_*` name. The bootstrap login must never be the app's runtime identity.

The VPS firewall permits 22/80/443, not database proxy port 5499. No firewall rule was opened. The existing regional SSH key was downloaded with owner approval and secured outside the project at `~/.ssh/arms-lightsail-ap-south-1.pem` (mode 600). First use recorded the host key; repeat connections require a match. Coolify's displayed DB SSL was disabled and its page had unrelated unsaved changes; none were saved/reset and no service was restarted.

Local development uses a loopback-only SSH tunnel, `127.0.0.1:15499` → VPS loopback `127.0.0.1:5499`. The staff URL uses that local endpoint. SSH encrypts the external transport; PostgreSQL TLS itself is not enabled by this setup. Stop the tunnel after use. For eventual deployment, choose and verify the actual protected application/database network and PostgreSQL TLS; do not copy the laptop's tunnel URL into production or disable remote certificate verification.

Commands: `npm run db:tunnel`, then `npm run check:database:tunnel` in another terminal. The diagnostic reads role/schema metadata only. `npm run db:staff:plan` prints the migration file hashes without connecting or writing. The setup command refuses existing resources and is not a general migration/upgrader. Applied hashes are recorded in `arms_auth.schema_migrations`.

## Server boundaries

- Every future privileged query/mutation must call server authorization with its allowed roles and record assignment. No dashboard PII or private CV endpoint exists yet. Current `/admin` verifies a live database session and exposes only a truthful unfinished-workspace message.
- Public candidates will not need accounts. There is no public staff registration or default admin account. Operator-only staff creation is documented in docs/20.
- Passwords use salted scrypt hashes. Codes are keyed hashes, short-lived, single-use and attempt-limited. Production cannot use the development email-code opt-out. Sessions have hashed random tokens, secure HttpOnly cookies, idle/absolute expiry and live account/role/version checks.
- Lightsail resource access grants full bucket read/write to applications on the attached instance. Validate SDK credential access inside the eventual application container before enabling uploads; host attachment alone is not an application upload test. Bucket permission/attachment evidence: `artifacts/qa/lightsail-bucket-attached.png`.
- SES needs an approved verified identity, correct regional permissions, and verified recipients during its testing restriction (or approved production access). Bucket resource access does not grant SES sending rights. After the owner completed the mailbox link, refreshed SES and confirmed the noreply sender identity displays **Verified** in Mumbai. Domain authentication, app sending permissions and delivery testing remain separate requirements.
- Public writes remain unavailable until approved privacy/retention, schemas, restricted database permissions, quarantine/scanning, file authorization, abuse controls and acknowledgement/retry behavior are implemented and tested together. The draft notice and owner-selected retention defaults are in docs/19.

## Remaining review of `001_initial.sql`

The supplied six-table public-schema file is still an unapplied proposal. Staff migrations do not apply it. Before jobs/forms integration:

- Define restricted runtime grants and default-deny candidate/application/document access; test actual roles. Owners and BYPASSRLS roles bypass row policies.
- Add job approval identity/record, publication/expiry invariants, safe slugs, field-length/enumeration validation and JSON-array constraints.
- Enforce document/candidate ownership in the database and service transaction; the proposal permits a foreign candidate's document reference.
- Model recruiter assignments, internal notes, idempotency and durable notification retries.
- Add retention deadlines, holds and explicit deletion/anonymization covering applications, candidates and private objects/versions; the proposal's foreign keys restrict candidate deletion.
- Choose consistent `updated_at` handling and test anonymous access, role/assignment boundaries, expired/closed jobs, duplicates and private file access using synthetic local/staging fixtures.

## Execution order and next inputs

Continue milestone 2 with reviewed job/data migrations and authorized staging publication workflows, using staff authorization prerequisites. Milestone 3 adds validated forms/documents after privacy approval. Milestone 4 completes staff workflows and retention operations. Current auth implementation is a shared prerequisite, not completion of those milestones.

Needed next: complete the full password/email-code/sign-out test for the created administrator account; approve the eventual app origin/network. Later: real approved jobs, public-form abuse controls, final privacy review, document scanning and operational retention/backup enforcement. Deployment remains blocked by docs/10.

References: [Coolify PostgreSQL](https://coolify.io/docs/databases/postgresql), [Coolify SSL](https://coolify.io/docs/databases/ssl), [pg TLS](https://node-postgres.com/features/ssl), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [Lightsail resource access](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-bucket-resource-access.html), [Lightsail bucket permissions](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-understanding-bucket-permissions.html). Staff security and SES operational details are in docs/20.
