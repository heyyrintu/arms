# 12 · Locked decisions and pending owner inputs

## Locked, from ARMS brainstorming
1. ARMS Talent Partners is a **multi-sector, end-to-end workforce management partner**.
2. Offer recruitment/manpower sourcing, deployment, attendance, payroll and workforce coordination.
3. Employment/payroll can be on **ARMS payroll or client payroll, by contract**.
4. **Employers and candidates are equal-priority audiences**.
5. Candidates have **live verified job listings AND general talent-network registration**.
6. Three industries are equal in visual emphasis: Warehousing & Fulfillment; Transportation & Drivers; Cafés & Hospitality.
7. Brand visual personality **Premium + Bold + Human**.
8. Hero **Editorial / Typography Dominant (~65% content / 35% photography)**.
9. Photography **People at Work**, emotional mood **Powerful & Ambitious**, composition **Operational Panorama**.
10. Main headline **Great people. Greater possibilities.** Tagline **Together for a Better Tomorrow.**
11. Brand color inspiration deep teal + restrained gold + ivory; use supplied logo.
12. Site should be premium editorial, authentic, mobile-first, simple to use, low visual gimmicks.

## Explicitly undecided or unverified
- Official website domain, legal organization details, address, verified email/phone.
- Actual launch date; real published vacancies; client authorizations and salaries.
- Detailed contractual obligations for the two payroll arrangements and regional legal review.
- Photographic assets/licensing and whether ARMS has consented authentic operation photos.
- Public contact hours, candidate support escalation matrix, HR roles and internal workflow.
- Backend selected on 14 November 2026: PostgreSQL database, Amazon Lightsail object storage storage, Auth0 staff sign-in. Hosting, region, credentials, account configuration, email and operational budgets remain pending; see `18-BACKEND-INTEGRATION-PLAN.md`.
- Admin identities and roles, data retention policy, final privacy notice and consent copy.
- More industries beyond three and multilingual support (possible future additions).

When implementing, do not treat undecided items as approved defaults.

## Owner instruction — 14 November 2026
The owner does not currently have operational photos and requested generated imagery. Four AI-generated workplace concepts are used in the local preview with visible disclosures and illustrative alt text. This supplements the preview; it does not authorize claims that the scenes depict ARMS people or premises, or satisfy the genuine-photo/launch sign-off gates. See `16-GENERATED-IMAGERY.md`.

## Privacy/retention instruction — 14 November 2026
Owner requested a privacy notice and delegated selection of market-informed retention periods. Project defaults are now 12 months for closed applications, 24 months for opted-in talent profiles and inactive enquiries, purpose-linked CV retention, 12 months for minimal security records and a proposed 90-day backup-rotation target, subject to applicable minimums and documented holds. See docs/19 for sources, clocks, exceptions and launch dependencies. This does not supply the missing legal operator/contact details or approve unfinished collection/deletion mechanisms.

## Owner-supplied legal/contact particulars — 14 November 2026
Legal operator: ARMS Talent Partners Private Limited. Privacy/support email: info@armstalentpartners.com. Business address: Sector 48, Gurgaon, Haryana 122018, India (spelling standardised from the owner's message). These populate Privacy and Contact; no phone, registration number, office hours or official website domain has been inferred. Legal review/security launch gates remain open.


## Owner backend clarification — 14 November 2026

The owner replaced Auth0 with staff login IDs/passwords held as secure hashes in PostgreSQL, and an email verification code required in production. Amazon SES was chosen for those codes. Applicants still need no account. The owner explicitly approved attaching Ubuntu-1 to the private arms-people-solutions Lightsail bucket; attachment is verified. This does not approve public bucket access or website deployment. See docs/20 for implementation and remaining gates.


## Owner-directed brand and language update — 14 November 2026

The owner explicitly added **Gig Work** as a fourth industry alongside Warehousing & Fulfillment, Transportation & Drivers and Cafés & Hospitality, with equal prominence. They requested a credible handshake/manpower/gig-worker hero, an expanded About with mission and vision, **Career** instead of Join Talent Network, and Hindi/English across the web app. These instructions supersede earlier three-sector, earlier hero-subject and language-pending descriptions in this document; they do not change payroll-by-contract, audience parity, authenticity, security or launch gates. Current implementation and evidence: docs/22.
