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

Deployment and hosted journey results must be recorded after they actually pass.
Actual privacy approval, retention deletion/correction operations, real provider
mail delivery, final content, accessibility/performance QA and launch sign-off
remain separate requirements. No real applicant data is accepted by this setup.
