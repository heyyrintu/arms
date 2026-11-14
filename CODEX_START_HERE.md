# Copy/paste this into Codex

> Work in this repository as the implementation engineer for **ARMS Talent Partners**. Read `AGENTS.md`, `README.md` and all `docs/` files before editing anything. Respect the locked brand, audience and service decisions. Begin by installing dependencies and running `npm run typecheck`, `npm run lint`, and `npm run build`; fix problems without changing the brand direction. Then follow `docs/07-IMPLEMENTATION-BACKLOG.md`, working milestone by milestone. Keep the public preview truthful: label fictional demo jobs, do not accept real personal data before secure storage and an approved privacy notice, and do not invent company facts. Preserve equal prominence for all three industries and both audiences. For each milestone, report changes, tests, open requirements and what I need to supply. Do not deploy until `docs/10-LAUNCH-CHECKLIST.md` is signed off.

## Initial tasks for Codex

1. Verify startup/build; address any TypeScript, lint or Next.js issues.
2. Make layout components pixel-consistent using actual asset dimensions and measured breakpoints.
3. Create a secure database integration based on `database/001_initial.sql`, admin authentication, private CV storage and server validation **once backend credentials and retention policy are available**.
4. Implement real job listing/admin workflows and public form submissions, replacing the deliberately unavailable API routes.
5. Source or commission approved photos per `docs/08-PHOTOGRAPHY-BRIEF.md`; replace `PhotoSlot` placeholders, preserving all-sector parity.
6. Complete company details, privacy notice, production email, deployment, end-to-end QA and SEO after approvals.

## Ask owner for these inputs as needed, not all at once
- Legal company name/trading name; verified support and business contact email/phone/address, official website domain.
- Confirmed jurisdictions and employment/payroll compliance model (review with qualified local adviser).
- Approved job listings, real operations imagery and permission to use it.
- Backend host/platform credentials and who gets admin access.
- Data retention policy, privacy notice approval, outbound email sender/transactional email provider.
- Exact service scope, industries, other languages and launch priorities.

## Do not skip
- No fabricated job postings or test applications on public site.
- No recruiter dashboard exposing candidate PII without server authorization.
- No accidental service-role secrets in `NEXT_PUBLIC_*` variables.
- No third-party images without valid usage rights and attribution when applicable.
- No generic résumé scoring/automatic rejection system in MVP.
