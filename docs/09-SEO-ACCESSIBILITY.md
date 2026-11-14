# 09 · SEO, accessibility, performance & tests

## Search
- Clear unique title/description per public route, canonical production domain once verified.
- Only set `NEXT_PUBLIC_SITE_LAUNCH_READY=true` when approved for indexing. Generate sitemap for published public pages, live jobs only, correct no-index for demos/drafts/closed roles.
- Structured data for `Organization` only with verified identity/contact fields; `JobPosting` schema only for genuine open vacancies with complete accurate fields and valid expiry.
- Semantic headings, descriptive links, image alt text, no indexing of admin/private endpoints.
- No fabricated job schema, fake reviews, unverified address or fabricated salary.

## Accessibility
- WCAG 2.2 AA target, keyboard-only navigation, focus visibility and skip links.
- Desktop, 360px mobile and 320px narrow mobile with no horizontal overflow.
- Ensure readable color contrast, labels, inline validation and accessible status messages.
- `prefers-reduced-motion`, sensible focus order, responsive reflow and touch targets.
- Job list filters and empty states must be announced when changed.
- Test with a screen reader, not only automated lint.

## Performance
- Prefer server-rendered content, minimum client JavaScript, optimized local images, avoid oversized mockups.
- Do not load tracking scripts before privacy approval; avoid unnecessary libraries/animation engines.
- Review LCP/CLS/INP on representative mobile connections and devices, measure rather than claim targets.

## Suggested checks
- Unit tests: validators, job publication status, duplicate submission and filter behavior.
- Integration: forms/database, file upload rejection, admin authorization, expired role protection.
- E2E: employer enquiry, candidate job flow, general registration, no matching roles, closed jobs, mobile menu, all industry pages.
- Security: upload payloads, rate limiting, unauthorized admin/API calls, privacy data export/deletion.
