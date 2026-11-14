# ARMS Talent Partners — Codex-ready website starter

**Status:** front-end foundation + complete implementation handoff, **not a live/production recruitment system**.

The project's strategy and copy reflect the decisions made for ARMS Talent Partners: **Premium + Bold + Human**, typography-dominant Editorial Hero (65% content emphasis / 35% photography), **People at Work** with a **Powerful & Ambitious** mood, employers and candidates with equal priority, industries with equal emphasis, and the headline **“Great people. Greater possibilities.”** The tagline is **“Together for a Better Tomorrow.”**

## Start here

1. Read **`AGENTS.md`** and **`CODEX_START_HERE.md`** — the coding-agent instructions and execution order.
2. Review the decisions, scope and launch blockers in `docs/`.
3. The working Next.js/TypeScript frontend is in `app/`, `components/`, `content/` and `public/brand/`.
4. Use `references/` for the original user-supplied brand images. Do **not** publish brand-board mockups as operational photography.

## Run the preview locally

Requires Node.js 20.9+ (Node 22 recommended).

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

`NEXT_PUBLIC_DEMO_MODE=true` with `npm run dev` displays **clearly-labelled fictional job examples** and a visible preview notice. Forms and CV inputs are disabled in every mode and **do not collect, send or store personal data**. Production builds always exclude fictional jobs, even when the demo flag is set. Never interpret sample jobs as real opportunities. For an unconfigured public build, set `NEXT_PUBLIC_DEMO_MODE=false`; job lists will be empty and submission API routes deliberately return HTTP 503. Pages remain no-index until a separate `NEXT_PUBLIC_SITE_LAUNCH_READY=true` flag is explicitly set after the launch checklist is complete.

## Project status (transparent)

### Included and implemented
- Responsive editorial homepage and global navigation/footer, with a persistent Hindi/English preference.
- Solutions index and three detailed solution pages.
- Industries index and **four equally prominent industry pages**, including Gig Work.
- Job discovery with keyword, industry, location and employment-type filters, accent-insensitive search and a keyboard-friendly reset **on labelled sample data in demo mode**.
- Sample job-detail pages that disable applications.
- Employer requirement, talent registration and conditional job application form UI.
- Expanded About with mission, vision and guiding values; Career at `/career` (legacy `/talent-network` redirects); Contact, Candidate Support and a detailed draft Privacy notice with a shared, versioned recruitment-retention schedule; see `docs/19-PRIVACY-AND-RETENTION.md`.
- Original ARMS wordmark and icon assets, using their actual dimensions.
- Five active optimized AI-generated workplace concepts, commissioned by the owner for preview, visibly labelled at every placement; see `docs/16-GENERATED-IMAGERY.md`.
- Persistent equal audience paths, sector-preserving job links, keyboard menu and skip-link behavior.
- Basic metadata, no-index preview behavior, accessible labels, mobile navigation, reduced-motion CSS.
- Administrator job management at `/admin/jobs`: save/reopen drafts, preview, approve/publish, edit back to draft, close/archive/restore, expiry and append-only activity. Isolated jobs schema and restricted writer/public-reader logins are configured. No real vacancies have been supplied or published; see `docs/21-JOB-PUBLICATION.md`.

### Not yet implemented (Codex must complete before launch)
- Applicant database migrations and deployed storage integration. Staff and jobs schemas are configured separately; the original applicant schema remains unapplied.
- Secure candidate/employer form submission, validation, anti-spam, notifications, acknowledgement emails.
- Owner-approved genuine vacancies and authenticated owner review of the new job-management route; hosted verification of application review and state changes.
- Real-bucket/scanner verification, public CV upload linkage and operational retention/deletion. Private document services and protected review screens are prepared/tested locally; see docs/24.
- Owner-reviewed genuine workplace photography/permissions (generated concepts do not establish operational authenticity) and verified company contact information.
- Final legal privacy notice, operational policies, domain, analytics, SEO and end-to-end tests.

These are **intentional launch blockers**, not features to silently claim as working.

## Selected stack (staff and jobs connected privately)

- Next.js 16 App Router + React 19 + TypeScript + custom CSS tokens (already scaffolded).
- PostgreSQL with server-only access. Staff migrations are applied in isolated `arms_auth`; jobs use isolated `arms_jobs`; applicant schema remains proposed.
- Database-backed staff login/password hashes and server-enforced roles, with Amazon SES email verification required in production; private Lightsail object storage attached to the approved VPS.
- Amazon SES for staff email codes; public-form notification/abuse controls remain to be implemented.
- Deploy on a supported Node.js platform; configure environment variables from the deployment platform's secret manager.

The owner replaced Auth0 with database-backed staff credentials and selected Amazon SES with sender `noreply@armstalentpartners.com`. The private Lightsail bucket is attached to Ubuntu-1. Staff authentication tables and a restricted database login were created after explicit owner approval; local credentials use the approved SSH tunnel and remain outside source. The owner has created the first staff administrator and verified its email. The real password/email-code/workspace/sign-out flow passed on 14 November 2026; session creation and revocation were independently checked on the hosted database. The temporary local test server and tunnel are stopped, and saved staff sign-in remains disabled pending production operational checks. Public submissions remain disabled. See `docs/18-BACKEND-INTEGRATION-PLAN.md` and `docs/20-STAFF-AUTH-AND-STORAGE.md`. Do not put secrets in git, browser bundles or documentation.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run check:handoff
npm run test:preview
npm run test:unit
npm run check:database
npm run check:storage
npm run check:ses -- --simulator
npm run db:staff:plan
npm run check:staff-database
# For local database access over the approved SSH path:
npm run db:tunnel
# In another terminal while the tunnel runs:
npm run check:database:tunnel
```

Dependencies and `package-lock.json` are now installed/generated. Typecheck, lint, handoff validation, production build and preview safety checks have been verified; see `docs/17-IMPLEMENTATION-STATUS.md` for scope and limits. This supplied folder has no Git repository, so no commit has been made.

Run the preview tests against a running local server. With fictional development jobs enabled, use `ARMS_TEST_DEMO=true npm run test:preview`. For a production server on port 3001, use `ARMS_TEST_URL=http://127.0.0.1:3001 npm run test:preview`. Tests reject non-local destinations and submit no personal data. They verify the current disabled preview, not future live collection.

## Core references
- `AGENTS.md`: instructions to Codex, non-negotiable constraints.
- `CODEX_START_HERE.md`: initial Codex task prompt.
- `docs/01-PRODUCT-BRIEF.md`: product, scope and KPIs.
- `docs/02-DESIGN-SYSTEM.md`: color, typography, photography, motion, responsive behavior.
- `docs/03-SITEMAP-AND-PAGES.md`: route list, content and user journeys.
- `docs/04-COPY-DECK.md`: approved working copy and disallowed assertions.
- `docs/05-FORMS-AND-FLOWS.md`: employer/candidate/admin UX.
- `docs/06-SECURITY-AND-DATA.md`: backend architecture, privacy and security requirements.
- `docs/07-IMPLEMENTATION-BACKLOG.md`: milestones and acceptance criteria.
- `docs/08-PHOTOGRAPHY-BRIEF.md`: photo shoot, usage and multi-sector parity.
- `docs/09-SEO-ACCESSIBILITY.md`: quality checks.
- `docs/10-LAUNCH-CHECKLIST.md`: operational blockers and launch sign-off.
- `docs/11-ASSET-INVENTORY.md`: original file map.
- `docs/12-DECISION-LOG.md`: locked product decisions vs open inputs.

## Operational truth

ARMS can support **ARMS-managed payroll or client-managed payroll depending on contract**. The public site must not promise that legal employment, payroll, statutory compliance, attendance or worker support responsibilities are identical under both arrangements. It also must not invent client names, placement metrics, vacancies, addresses, phone numbers or success stories.

Additional implementation detail: `docs/13-API-CONTRACTS.md`, `docs/14-ADMIN-UX.md`, `docs/15-OWNER-INPUTS.md`.

Owner refresh: Gig Work, handshake/workforce hero, expanded About, Career naming and full owned-UI Hindi/English rendering are recorded in `docs/22-BRAND-AND-LANGUAGE-UPDATE.md`. Authored vacancy content remains in its entered language. All collection and launch gates remain in effect.

Forms milestone preparation (15 November 2026): strict three-purpose validation, isolated saving/review service, prepared restricted migrations and rollback/security tests are in [docs/23](docs/23-INTAKE-FOUNDATION.md). Public forms remain closed; CV processing and delivery are still pending. `npm run db:intake:plan` prints migration hashes without connecting or applying.

Private CV/review increment (15 November 2026): [docs/24](docs/24-PRIVATE-CV-AND-REVIEW.md) records protected bilingual review screens, quarantined PDF processing, private audited downloads and a disabled internal notification worker. Migrations 008–011 remain unapplied to the hosted DB; public collection remains closed.

Private infrastructure update (15 November 2026): [docs/25](docs/25-PRIVATE-INTEGRATION-VERIFICATION.md) records applied empty intake migrations/restricted roles, real rollback-only PostgreSQL checks and an actual instance-credential private bucket round trip. The scanner host/capacity decision and full collection/retention/privacy approvals remain open; all collection and worker gates stay disabled. No deployment occurred.

Owner-approved same-VPS scanner (15 November 2026): [docs/26](docs/26-SAME-VPS-SCANNER.md) records the capped private ClamAV installation and engine/maintenance checks. The site and real submissions remain disabled pending full workflow/privacy/operational approval.
