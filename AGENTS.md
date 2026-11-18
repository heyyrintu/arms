# Instructions for Codex / any coding agent

You are implementing the ARMS Talent Partners website from the supplied repository and documentation. **Do not reinterpret the agreed strategy or replace it with a generic manpower agency template.**

## Before changing code
1. Read `README.md`, `CODEX_START_HERE.md`, all `docs/*.md`, and inspect `content/site.ts`.
2. Review the supplied images in `references/` (brand references) and `public/brand/` (optimized website marks).
3. Run install, typecheck, lint and build; report failures truthfully.
4. List assumptions and blocked items, then deliver incrementally without inventing business facts.

## Non-negotiable product decisions
- The business is **ARMS Talent Partners**, end-to-end workforce management: recruitment/supply, deployment, attendance, payroll and coordination.
- Both **ARMS-managed and client-managed payroll** must be supported, according to signed arrangements.
- **Employers and job seekers are equally important**; expose both in hero, header, navigation and industry pages.
- **Warehousing & Fulfillment, Transportation & Drivers, Cafés & Hospitality, Gig Work** get equivalent prominence, section height, photographic quality, and role coverage. Do not make warehousing the default/preferred industry.
- Owner update: provide Hindi/English UI, Career wording and mission/vision; retain all collection and launch gates.
- Hero copy is **“Great people. Greater possibilities.”**; tagline is **“Together for a Better Tomorrow.”**
- Identity is **Premium + Bold + Human**; Editorial Hero with approx. **65% content / 35% photography emphasis**; strong eye-level workplace panorama, **Powerful & Ambitious**, not fake stock-photo smiles.
- Use the owner’s 17 November 2026 design system in `../design-system/ARMS_Design_System.md`: Imperial Burgundy, Champagne and Montserrat, with supplied primary/reverse logo assets. This supersedes the older teal palette. Avoid metal gradients, glassmorphism, spinning stars, generic HR icons and endless cards.
- Jobs must be genuine, admin-approved and published; demo listings must remain labelled and blocked from application and public indexing.
- A candidate can apply to specific jobs **or** join the general talent network. Do not require an account for a public application.
- Do not invent contact details, case studies, placement counts, names, quotes, testimonials, legal guarantees or live vacancies.

## Engineering rules
- Prioritize accessible, responsive, fast mobile experiences (target WCAG 2.2 AA; test keyboard, screen readers, contrast and reduced motion).
- Keep SEO metadata, clear heading structure, minimal client-side JS and semantic components.
- Replace API 503 routes only after secure server-side validation, database, private file storage, abuse prevention and permissions are implemented and tested.
- Authentication and role checks must happen server-side, including every admin mutation. Public API must never expose PII/CVs or privileged database keys.
- Do not persist sensitive applicant data before the company provides approved privacy notice, retention rules, contact details and safeguards.
- Implement real errors, empty states, loading states and acknowledgements; never show “success” if storage/delivery failed.
- Image licensing must be documented. Use approved genuine photos; never present reference mockups as actual ARMS premises/people.
- Keep all demo-mode behavior explicit and disable it for production.
- Treat SQL in `database/001_initial.sql` as a suggested foundation, review constraints and RLS/authorization before deploying.

## Working sequence
Follow `docs/07-IMPLEMENTATION-BACKLOG.md` in order. After each milestone: run check/build/tests, inspect routes, summarize changed files, blockers, and next tasks. Never claim launch-ready without every gate in `docs/10-LAUNCH-CHECKLIST.md`.

## Definition of done
Every primary route works, both audience funnels store and confirm submissions securely, admins can manage published jobs and applications, real approved content is present, accessibility/performance/security are checked, and the company owner has signed off on legal/company particulars and deployment.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
