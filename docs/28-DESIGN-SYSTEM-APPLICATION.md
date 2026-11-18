# Design system applied — 17 November 2026

The owner requested applying the updated design system to the company website. The supplied `../design-system` handoff is now the website’s visual source of truth, superseding teal-era instructions. The implementation remains on the existing checkout/branch; no commit, push, hosted staging update or public deployment was made.

## Applied

- Full source semantic tokens copied into `app/arms-tokens.css`, with website-local font URLs. `scripts/sync-design-system.mjs` / `npm run design:sync` refresh the tokens, five Montserrat faces, primary/reverse logos, symbol and favicon. A deployed checkout is self-contained.
- Shared CSS now uses the new semantic colors across public and staff components. Burgundy leads; champagne accents statements, rules, closing buttons and the contact panel. Warning/error/success colors remain distinct. Input boundaries use contrast-safe muted plum.
- Source type scale, local Montserrat and licensed Noto Sans Devanagari, 4px controls/8px cards, warm surfaces, restrained motion, maroon/light and gold/dark focus treatments. The mobile header fits logo, language choice and menu on one row at 320px, followed by two equal audience actions.
- New supplied wordmark in the header, actual reverse artwork on the dark footer without an ivory backing, and new supplied icon. No logo was generated or redrawn.
- White/maroon audience cards, consistent service/industry cards, lifecycle connectors, contact panel and one thin signature sweep under the homepage image.
- Current Indian workplace imagery and all English/Hindi disclosures retained. The pre-existing photo/content changes in this checkout were preserved. Four industries and both audiences remain equally prominent.
- Updated docs/02, README and agent guidance to point subsequent work at the current handoff. Font sources/licences are in `public/fonts/README.md`.

## Verification

- Dependency installation, typecheck, lint, production build and handoff validation pass.
- All 72 existing unit/security tests and 12 existing local preview route checks pass. Initial local connection attempts were restricted by the execution environment; approved loopback access resolved those environment errors. No test required real applicant data or provider changes.
- Browser measured 18 routes in English and Hindi at 320, 360, 650, 768, 1024, 1180, 1181, 1240 and 1440px: **324 measurements**, one h1 per route, no horizontal overflow. Industry cards retain equal image frames and heights within each layout.
- Computed text contrast check: 18 English routes (965 rendered text elements) and six Hindi routes (403 elements), no failures at the applicable 4.5:1/3:1 text thresholds. This checks computed solid/alpha backgrounds; it is not a comprehensive accessibility certification.
- Mobile menu opens all six navigation links; Escape closes it and returns focus to its toggle. Keyboard activation of Skip to content focuses `main-content`. Browser console review found no warnings/errors. Reduced-motion CSS is retained; no independent OS-preference emulation was performed.
- Desktop full-page and English/Hindi mobile screenshots were visually reviewed. The reverse footer artwork, generated-image labels, equal audience CTAs and sector presentation were confirmed.
- Protected staff screens share the updated CSS; a new authenticated staff lifecycle/browser test was outside this presentation change. Existing authorization tests pass, and anonymous staff routes still redirect to sign-in.

## Local evidence and review

The normal local preview is available at `http://127.0.0.1:3000` while its preview process runs. It uses disabled staff authentication, job integration and public launch flags. Real public submission routes remain closed; the private Coolify deployment was not changed.

Local ignored evidence in `artifacts/qa/`:

- `design-system-homepage-desktop.jpg`, `design-system-homepage-full.jpg`
- `design-system-english-mobile.jpg`, `design-system-hindi-mobile.jpg`
- `design-system-responsive-checks.json`, `design-system-contrast-checks.json`, `design-system-keyboard-checks.json`

The design is ready for owner review locally. Human screen-reader/native-language review and the existing privacy, genuine-content and operational launch requirements remain separate, as recorded in docs/10 and docs/27.
