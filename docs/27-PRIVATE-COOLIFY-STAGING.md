# Private synthetic Coolify staging

Owner requested running the workflow in Coolify on the server named `localhost`
(Hostinger). This is a separate private staging resource. It is not the public
launch approval required by `10-LAUNCH-CHECKLIST.md`.

## Isolation

- A new `arms_private_stage` database, restricted role per capability, isolated
  Compose network and new staging volumes. No existing database/bucket is copied.
- All contact fields, job fixture and CV bytes are generated on the server.
  `/api/staff/staging` accepts enum choices and a retry UUID only. All mutations
  require the independently authorized synthetic administrator and same origin.
- The whole site requires an eight-hour signed, Secure, HttpOnly staging cookie.
  Staff sign-in still requires a password and an expiring six-digit code.
- Codes, test acknowledgements and staff notifications go into a protected
  synthetic mailbox. No SES credentials or external deliveries exist here.
- Staging CVs use a private filesystem adapter, separate from the actual private
  Lightsail S3 bucket. A new ClamAV container scans over a private Unix socket;
  stale signatures, unavailable scanner and errors refuse document release.
- The synthetic published job is accepted only by the isolated application test.
  `JOBS_ENABLED=false` keeps it out of public feeds. All original public form
  endpoints remain unavailable. The approved fixture privacy version is injected
  only into the fixed-case test service; the actual policy remains draft.
- This verifies workflow wiring in staging; it does not establish real-data,
  actual Lightsail S3/SES, production networking, legal or launch readiness.

## Operator setup

Build `Dockerfile.staging` through `ops/staging/compose.yaml` on a separate Coolify
resource. Set HTTPS `APP_BASE_URL` to the gateway service domain (port 8080).
Create four unrelated random values in protected configuration:
`STAGING_RUNTIME_SECRET`, `STAGING_GATE_PASSWORD`, `STAGING_BOOTSTRAP_PASSWORD`
and `STAGING_ADMIN_PASSWORD` (43+ base64url characters each). Do not attach actual
ARMS `.env`, database URLs, AWS keys, or production file volumes.

Open `/staging/unlock`, then sign in at `/admin/sign-in` as `qa@example.invalid`.
The protected `/staging/mailbox` shows the synthetic sign-in code. Run the three
journeys at `/admin/staging`, retry a saved case, review each receipt, download
only a clean scanned CV and exercise revision-checked status changes. Verify
anonymous and wrong-role requests remain denied and original public submission
routes still refuse collection.

Initial signature downloads require Internet access; the scanner has no exposed
TCP port. Restart the staging scanner to refresh signatures before testing after
48 hours. The per-scan freshness check fails closed meanwhile. This staging
scanner has a 1280 MiB hard memory limit and 0.5 CPU allocation. Review host
capacity before activation. No production scanner or existing service is changed.

## Outstanding checks and gates

Hosted synthetic journey results are recorded below.
Actual privacy approval, retention deletion/correction operations, real provider
mail delivery, final content, accessibility/performance QA and launch sign-off
remain separate requirements. No real applicant data is accepted by this setup.

## Preparation results — 15 November 2026

- Type check, lint and production build passed. 72 security/unit tests and all
  12 local preview route checks passed, including staging routes returning 404
  in a normal instance. Tests that open temporary sockets required local network
  permission; their restricted-run failures were not application regressions.
- Separate branch: `codex/private-coolify-staging` in the existing ARMS repository.
  No main-branch change. Ignored `.env*`, private keys and new QA screenshots were
  excluded from the source upload and Docker build context.
- Coolify resource: ARMS-Private-Staging / private-staging /
  ARMS Private Synthetic Staging, server `localhost`, application ID
  `0mktgv1ycgori0mrbvfny5ly`. Manual deployments; no automatic build-argument
  injection. Preserve repository files for the read-only scanner/proxy configs.
- Base directory `/ops/staging`, Compose location `/compose.yaml`, gateway 8080.
- Protected staging configuration is prepared locally in ignored
  `.env.staging-access` (owner read/write only). The owner entered and saved
  these staging-only credentials in Coolify. No actual ARMS credentials were copied.


## Hosted results — 15 November 2026

Private preview: https://arms-staging.dronalogitech.com/staging/unlock

Coolify deployed source `b3b6394827791e1f6cc4f22daa8052d24f55a892` on
`localhost`. Deployment `ofwetyxiyrodvwsqz8lssomx` completed successfully. The
initial sslip.io address presented an untrusted certificate. No browser warning
was bypassed; the resource moved to the existing server-domain wildcard, with
HTTPS, no-index and the same private access gate. No DNS credentials or existing
company application were changed. Runtime logs confirmed Next startup and the
scanner's successful signature update/database test (daily 28183).

Verified through the hosted browser UI:

- An unauthenticated visitor sees the private-access block. The staging password
  unlocks the site; staff access separately requires password and a captured,
  expiring email code. The synthetic administrator reached Staff workspace.
- Employer enquiry saved, returned a reference and kept that reference on retry.
  The protected mailbox showed one acknowledgement and one internal notification
  for that enquiry; neither was delivered externally.
- Career profile saved with a generated valid one-page PDF. The actual separate
  ClamAV service reported clean; authorized record review worked. The download
  action reported `CV download prepared.` after the protected response. A browser
  automation download-event hook stalled, so a downloaded filesystem copy was
  not verified through that hook. Local `pdfinfo` independently verified the
  generated PDF structure (one page, no JavaScript, no encryption).
- Career review changed from Received to Reviewing and acknowledged the save.
- A job-specific application to the private fixture saved and its CV scanned
  clean. Withdrawal saved, removed further status transitions and set the
  12-calendar-month application deadline, without future-role opt-in.
- Hindi review labels/status/retention text rendered while source record values
  stayed unchanged. The site was returned to English.
- Sign-out succeeded. Opening the saved record again redirected to Staff sign-in.

`scripts/check-private-staging.mjs` also passed ten hosted endpoint checks:
missing gate -> 401; actual unlock -> 303; all three real-data submission routes
-> 503; public jobs -> 200 with an empty items array; gate without staff session
cannot mutate (403) or open the workspace (307 to sign-in); foreign-origin unlock
-> 403. That script submits no applicant record. It refuses any other hostname
and reads only the ignored staging configuration. Existing 72 unit/security tests
and 12 local preview checks pass; typecheck/lint/build pass. Runtime-only npm audit
reported zero advisories; development-tooling advisories remain separate.

Screenshot evidence is local/ignored at
`artifacts/qa/private-coolify-staging-review.jpg`. The stack contains only synthetic
fixtures. Actual Lightsail PostgreSQL/S3/SES and the existing scanner were not
used or changed by this staging deployment. This preview uses separate PostgreSQL,
private filesystem storage, ClamAV and captured email.

### Remaining requirements and owner review

Review the private preview and its generated imagery, mission/vision and Hindi
terminology. Public intake, actual provider delivery/storage activation, approved
privacy notice, correction/deletion/legal-hold and backup operations, native
language/legal review, real vacancies, accessibility/performance checks and all
launch sign-offs remain open. This milestone does not authorize a public launch
or certify production retention/deletion. No production launch box was checked.
