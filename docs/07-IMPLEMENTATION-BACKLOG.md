# 07 · Codex execution backlog (ordered)

Work milestone by milestone, showing tests, screenshots/review notes, blockers and proposed diff after each. See `17-IMPLEMENTATION-STATUS.md` for the current evidence and limitations. **Do not bypass launch gates to simulate completion.**

## Milestone 0 — Verify the supplied starter
- [x] Read `AGENTS.md` and docs, inspect assets.
- [ ] Install deps, commit a lockfile, run typecheck/lint/build. **Installed; lockfile generated; checks pass. Commit pending: supplied folder has no `.git` repository.**
- [x] Review semantic HTML and layout at desktop, tablet, narrow mobile.
- [x] Fix broken routes and missing image dimensions, zero new business claims.
- **Accept:** all public routes render, no build errors, links work, demo data properly marked.

## Milestone 1 — Visual finish & content structure
- [x] Preserve editorial 65/35 hero, two equal CTAs, powerful/photo-led brand personality.
- [ ] Add permissioned photographic assets with responsive crops and meaningful alt text. **Owner requested generated concepts for preview on 14 November 2026; four labelled concepts are integrated. Genuine photo/permission and final launch approval remain open.**
- [x] Confirm logo fit and typography against source references; optimize loading and media size.
- [x] Ensure three industries have identical visual prominence and image quality.
- [x] Add fully accessible navigation interactions and industry/job contexts.
- **Accept:** no reference mockup passed as client/employee photo; mobile-first parity established; editorial narrative intact.

## Milestone 2 — Jobs/data
- [ ] Install chosen Postgres integration and migrations; create model-safe query layer.
- [ ] Public query serves only `published`, `not expired`, approved jobs; sort newest or configured priority.
- [x] Search/filter by keyword/location/industry/type; salary filter only if actual salary is available. **Preview filtering and unit/browser checks complete; live-data verification remains blocked by backend setup. No confirmed salaries are available, so no salary filter is shown.**
- [ ] Live job detail must show verified attributes; closed jobs cannot accept applications.
- [ ] Demo data only in local preview; never publish fake vacancies or index demo pages.
- **Accept:** create/update/close an authorized test job in staging and verify public behavior.

## Milestone 3 — Forms and documents
- [ ] Add server schemas for employer enquiry, talent registration and job application.
- [ ] Integrate Postgres writes, private file storage, size/type limits, abuse prevention.
- [ ] Integrate transactional acknowledgements and internal notification channel.
- [ ] Implement errors, idempotency/duplicate handling, consent version and privacy workflow.
- [ ] Test no PII exposure; restore form data on transient errors where safe.
- **Accept:** valid staging submissions persist exactly once and notify; invalid/oversized inputs fail safely; private CVs inaccessible publicly.

## Milestone 4 — Protected admin console
- [ ] Configure admin authentication and server-side role authorization.
- [ ] Job create/edit/publish/close/archive with previews and expiry.
- [ ] Employer leads, candidate registrations, applications: review, filter, notes, statuses, assignments.
- [ ] Audit logging, minimal exports, retention/deletion, no broad PII overexposure.
- **Accept:** anonymous users cannot access admin data, recruiters cannot exercise admin-only operations, edits appear on public listing with correct state.

## Milestone 5 — Real company and legal content
- [ ] Replace all pending company phone/email/domain/address with owner-verified details.
- [ ] Agree actual workforce service/legal descriptions and payroll responsibilities.
- [ ] Approve privacy notice, rights contact, retention schedule, job posting consent and photography permissions.
- [ ] Add real vacancies and real images, or keep truthful empty states if none.
- **Accept:** owner approves published copy and legal/privacy reviewers sign off.

## Milestone 6 — Launch QA / SEO / deploy
- [ ] Responsive, keyboard, screen reader, WCAG 2.2 AA audit and contrast.
- [ ] E2E tests for both audience funnels, admin and edge/error states.
- [ ] Performance/security/production log checks; deploy to staging then production with HTTPS/backups.
- [ ] Configure canonical URLs, sitemaps, correct robots and domain, analytics only with privacy approval.
- [ ] Follow `docs/10-LAUNCH-CHECKLIST.md` and get final owner sign-off.
- **Accept:** forms, jobs and admin workflows work with real approved integrations, plus no unresolved launch blockers.
