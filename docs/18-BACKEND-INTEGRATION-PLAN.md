# Selected backend — 14 November 2026

**Owner decision:** PostgreSQL database, Amazon Lightsail object storage for private CVs (owner clarified after initially selecting S3), Auth0 for staff sign-in. These services are selected, not connected. This project has not created or modified any account, bucket, database, staff user or deployment, and no migration has been applied.

## Next required inputs

1. The owner confirmed PostgreSQL is hosted on **Coolify**. A `DATABASE_URL` is supplied in the ignored `.env` file. Direct public checks time out; read-only access through the approved SSH tunnel now succeeds against PostgreSQL 18. The account is privileged and the proposed public-schema tables are absent. Staging scope and least-privilege runtime permissions still need approval/review before migrations. Use an ignored env file or a secret manager for credentials. Never use a database owner/superuser as the public app's runtime account.
2. Approved retention periods for candidate profiles, job applications and CVs; finalized privacy operator/notice before collection.

Later, at their implementation milestones: Lightsail bucket access credentials or resource access, Auth0 tenant and Regular Web Application settings, authorized staff identities and role assignments, email provider and verified sender, abuse-control provider, approved staging domain. Do not infer any of these from unrelated accounts on this computer.

## Intended server boundaries

- Public job reads use a limited query projection of authorized, published and unexpired jobs. Browser code never receives database credentials or internal applicant records.
- Employer/candidate writes remain disabled until privacy, retention, validation, upload checks and abuse prevention exist together. A successful response follows committed storage; notification failure must not cause duplicate applications.
- Auth0 staff sessions will be checked on the server. Every privileged query/mutation also verifies the staff role and record assignment. Public candidates will not need accounts. Self-registration must never confer a staff role.
- Private documents use random server-generated keys, restricted IAM permissions and scan/quarantine state. Only an authorized, audited server request may issue a short-lived download ticket. S3 has no public CV URLs.

## Provider documentation checked

Auth0's current SDK documents server-side `Auth0Client` use, a Regular Web Application, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, cookie-encryption `AUTH0_SECRET`, and the Next.js 16 `proxy.ts` convention. Confirm the installed SDK's matching documentation before implementation. Register callback/logout URLs for the actual app origin. No Auth0 SDK has been installed or configured yet. [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0/blob/main/README.md)

For Lightsail CV storage, keep the bucket permission **All objects are private**. Account-level S3 Block Public Access also affects Lightsail. Do not copy generic S3 bucket-policy/ACL setup into Lightsail without checking its supported controls. Use a dedicated CV bucket, separate from public website media. [Lightsail security guidance](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bucket-security-best-practices.html)

Lightsail bucket access keys grant full access to that bucket, not an arbitrary prefix-limited role. Keep them server-only; resource access is another option when the application runs on a Lightsail instance. No keys or Auth0 settings are currently configured in the project environment; bucket permissions have not been inspected remotely. The supplied `AWS_REGION` and `S3_PRIVATE_CV_BUCKET` variable names are retained. [Lightsail access keys](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-creating-bucket-access-keys.html)

Run `npm run check:database` for a bounded, read-only diagnostic. It loads ignored env files, verifies remote TLS certificates, reads only role/schema metadata, and prints sanitized statuses. It never migrates, reads applicant rows, uploads files or logs credentials. URL TLS parameters cannot disable certificate verification; a private CA can be supplied through the URL's `sslrootcert` file path. [PostgreSQL driver TLS configuration](https://node-postgres.com/features/ssl)

PostgreSQL table owners and `BYPASSRLS` roles can bypass row policies. Separate migration ownership from runtime permissions and test both grants and row-level policies with the actual runtime role. RLS alone is not server authorization. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Review of `database/001_initial.sql` before migrations

The supplied file remains a proposal. Resolve these in reviewed migrations and tests:

- No runtime grants, role membership or row-level policies are defined. Default-deny access and least-privilege runtime roles need explicit implementation.
- Job publication has no approval identity/record, and published jobs can have a null publication time. Define the approval invariant, safe slug checks and publication/expiry ordering.
- The JSON role lists are not constrained to arrays. Add checks and server schemas, with bounded field lengths and enum validation.
- `job_applications.document_id` can reference a document owned by a different candidate; candidate/document ownership needs a database constraint and a transactional server check.
- Staff roles, recruiter assignments, internal notes, idempotency records and durable notification retries are not fully modeled.
- Approved retention/deletion schedules are absent. Candidate deletion is restricted by existing applications; implement an explicit deletion/anonymization workflow covering database rows, S3 objects and any object versions according to policy.
- `updated_at` columns have no update trigger. Choose a consistent migration/service strategy.
- Tests must exercise anonymous reads/writes, recruiter/admin boundaries, closed/expired jobs, duplicate requests, private file access and deletion. Do not use real applicant data as fixtures.

## Execution order

Milestone 2: reviewed PostgreSQL migrations, restricted public job queries and authorized staging job publication lifecycle. Milestone 3: validated, abuse-controlled forms, private documents and acknowledgements after privacy approval. Milestone 4: complete Auth0-protected staff workflows and retention operations. Shared authorization prerequisites must exist before any privileged staging mutation. All stages remain subject to the launch checklist; this plan is not launch sign-off.

## Coolify connection follow-up

The configured address uses a public IPv4 address and an explicit non-default port; credentials and the endpoint are not reproduced here. Previous PostgreSQL and TCP probes timed out, so a network/service issue is possible. This does not establish which setting is wrong.

Read-only inspection should confirm that the database is running, the supplied address matches Coolify's generated public URL, the TCP proxy/public port is active if using external access, and provider/host firewall rules allow the intended client. An app on the same Coolify destination network should use the internal URL; local development can instead use a separately configured SSH tunnel. Do not enable broad public access or disable TLS verification merely to make the diagnostic pass.

Official references: [PostgreSQL access URLs](https://coolify.io/docs/databases/postgresql), [public access configuration](https://coolify.io/docs/databases/configuration/general), [database SSL](https://coolify.io/docs/databases/ssl). The owner supplied the Coolify resource page and it was inspected read-only. The `armc-db` resource shows Running, image `postgres:18-alpine`, public TCP proxy access and port 5499; the configured local connection uses the same port. The page contains unsaved changes, so the displayed selections are not assumed to be committed. Proxy logs show Nginx startup completion without an error in the visible excerpt. SSL shows Disabled, and the page requires a stopped database to change encryption. No settings were saved or reset, no restart was performed and no credential was revealed. Firewall rules and actual public-port forwarding remain unverified. The supplied `postgres` login is a bootstrap identity; create and verify a separate restricted runtime role before app integration.

## Corrected server topology

Owner clarified that the Coolify control panel and its `localhost` server run on a **Hostinger VPS**. A separate **Lightsail VPS** was added as a remote server in Coolify, and `armc-db` runs on that Lightsail VPS. Inspect the Lightsail database host's firewall and proxy/port forwarding for external database connectivity. Do not assume the control-panel host is the database host.

A read-only DNS comparison confirms that the configured database address differs from the current resolved Coolify control-panel address, and the configured public port matches 5499. This does not independently verify the Lightsail instance's public IP; match it in the AWS console. AWS console sign-in is still pending. No firewall or service configuration was changed.

## Verified Lightsail firewall finding

After the owner signed in, matched the database address to the Lightsail `Ubuntu-1` instance in Mumbai (without copying the connection string). Instance/system checks passed. Its Networking page lists inbound TCP 22, 80 and 443; there is no rule allowing TCP 5499. This blocks the attempted direct public database connection at the Lightsail firewall. Host firewall/proxy listening and database TLS remain separate checks. Firewall editors were inspected and cancelled; no rule was added or modified.

A local-only SSH tunnel through existing TCP 22 can keep the database port private. No matching Lightsail private key was initially found. The owner then approved downloading the existing default Lightsail SSH key and storing it securely; it is now outside the project in the user SSH folder with mode 600. Proposed tunnel: local loopback port 15499 to VPS loopback port 5499, over SSH as the existing Ubuntu account. No remote DB firewall opening is proposed. Public direct DB access would additionally require a narrowly scoped rule and verified database TLS; SSL is currently disabled in the Coolify UI.

## SSH connection verified

The owner approved downloading/using the existing regional Lightsail SSH key. It was moved from Downloads to `~/.ssh/arms-lightsail-ap-south-1.pem` with owner-only permissions, outside the project. The first connection recorded the host key; repeatable tooling requires the known host key to match. No private-key contents are in source, logs or documentation.

A read-only remote listener check confirmed the existing proxy listens on 5499. The localhost-only tunnel `127.0.0.1:15499` → VPS loopback `127.0.0.1:5499` succeeded. PostgreSQL 18 answered a read-only transaction: the configured role has elevated privileges, and zero of the six proposed tables exists in the public schema. No rows were read, no migration was run and no cloud/firewall/database setting was changed. PostgreSQL TLS remains disabled; SSH encrypts the computer-to-VPS transport. This does not enable public direct database access.

Repeat locally with `npm run db:tunnel`, then `npm run check:database:tunnel` in another terminal. Stop the tunnel with Ctrl+C. The original DATABASE_URL stays unchanged; tunnel diagnostics retarget it to loopback in memory without printing credentials. Optional local overrides: DATABASE_SSH_USER and DATABASE_SSH_KEY_PATH. The test tunnel is closed after verification.

Before writes: confirm staging scope, prepare a restricted runtime database role and review migrations. Privacy notice, retention, company contacts, Auth0 and private Lightsail storage access remain prerequisites before personal-data collection.

## Privacy and retention drafting update

At the owner's request, a detailed draft notice and shared retention defaults are implemented in `content/privacy.ts`, `/privacy` and form preview wording. See docs/19 for periods, research and legal exceptions. Replace references to wholly unspecified retention with these selected defaults; the legal identity, monitored request channel, legal review and tested enforcement remain open. No collection or migration has been enabled by the drafting work.

The owner has now supplied the legal operator, privacy email and business address, and the notice/contact pages use them. The shared retention defaults are selected under the owner's instruction; legal sign-off, operational request handling, retention enforcement and the remaining auth/storage/security integrations still precede collection. See docs/19 and the latest status entry.
