# 10 · Public launch checklist (must all pass)

## Company & content approvals
- [ ] Business owner confirms exact company/legal/trading names, domain, verified email, phone, address and hours.
- [ ] Owner verifies all service claims and the ARMS/client payroll responsibility explanations.
- [ ] All published jobs are genuine, authorized, unexpired and salary/locations accurately represented.
- [ ] Real photography is approved/licensed, with worker/site permission where needed.
- [ ] Any testimonials, clients, awards and numbers have evidence and explicit permission.

## Privacy & security approvals
- [ ] Final privacy notice and employer/candidate contact channels approved for actual jurisdiction.
- [ ] Consent/notice records, access limits, retention/deletion workflows, backups and incident plans implemented.
- [ ] Admin MFA/authorization tested; no CV or applicant PII publicly readable.
- [ ] Private CV storage, file validation and malware risk mitigation implemented.
- [ ] Form validation, abuse controls and secret management verified.

## Functional checks
- [ ] Employer form stores, routes, acknowledges and handles errors.
- [ ] Talent registration stores, acknowledges and can be corrected/deleted.
- [ ] Job application only accepts approved live jobs and actually persists.
- [ ] Admin can publish/close jobs; closing immediately removes application capability.
- [ ] All mobile/desktop routes, links, filters, menus and empty/error states tested.
- [ ] Demo jobs disabled and preview banners removed on production.

## Quality/deploy
- [ ] Accessibility audit, performance budget, responsive checks and basic SEO passes.
- [ ] Production HTTPS, proper domain, emails, backups and observability configured.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` and E2E suite pass.
- [ ] Owner signs off on staging before public deployment.

**Do not mark ready or launch while any mandatory item remains unchecked.**
