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

`NEXT_PUBLIC_DEMO_MODE=true` displays **clearly-labelled fictional job examples** and a visible preview notice. Forms **do not send or store personal data**. Never interpret sample jobs as real opportunities. For an unconfigured public build, set `NEXT_PUBLIC_DEMO_MODE=false`; job lists will be empty and submission API routes deliberately return HTTP 503. Pages remain no-index until a separate `NEXT_PUBLIC_SITE_LAUNCH_READY=true` flag is explicitly set after the launch checklist is complete.

## Project status (transparent)

### Included and implemented
- Responsive editorial homepage and global navigation/footer.
- Solutions index and three detailed solution pages.
- Industries index and **three equally prominent industry pages**.
- Job discovery with working client-side search/filter **on labelled sample data in demo mode**.
- Sample job-detail pages that disable applications.
- Employer requirement, talent registration and conditional job application form UI.
- About, Contact, Candidate Support and draft Privacy pages.
- User-provided ARMS wordmark and icon assets; photography slots are deliberate placeholders.
- Basic metadata, no-index preview behavior, accessible labels, mobile navigation, reduced-motion CSS.

### Not yet implemented (Codex must complete before launch)
- Postgres database, migrations and deployed storage integration.
- Secure candidate/employer form submission, validation, anti-spam, notifications, acknowledgement emails.
- Live vacancies, authenticated admin console, job publishing, application review and state changes.
- Private CV upload/retention, secure admin access and audit logging.
- Actual approved workplace photography and verified company contact information.
- Final legal privacy notice, operational policies, domain, analytics, SEO and end-to-end tests.

These are **intentional launch blockers**, not features to silently claim as working.

## Proposed production stack

- Next.js 16 App Router + React 19 + TypeScript + custom CSS tokens (already scaffolded).
- PostgreSQL with server-only database access and migrations in `database/` (proposed; not connected).
- Hosted authenticated admin, role-based access and private object storage for CVs.
- Email delivery provider and rate limiting (to be chosen/configured).
- Deploy on a supported Node.js platform; configure environment variables from the deployment platform's secret manager.

No specific vendor account is assumed to exist. Do not add keys to git, browser bundles or documentation.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
node scripts/validate-handoff.mjs
```

No package lock is included because dependencies could not be installed in this authoring environment. Codex should run `npm install`, commit the resulting lockfile, then run the full checks. The source has been structurally checked but **an actual npm production build has not been verified** here.

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
