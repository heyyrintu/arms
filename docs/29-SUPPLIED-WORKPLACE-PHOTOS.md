# Owner-supplied workplace photos — 18 November 2026

The owner supplied five replacement PNG files in `../assets/photos/` and authorized using them on the website. They confirmed that all five are AI-generated. These files supersede the previous locally generated working-day set. No new images were generated or creatively edited for this update.

## Source and deployment copies

| Source in `../assets/photos/` | Runtime file in `public/photos/supplied/` | Placement |
| --- | --- | --- |
| `hero.png` | `hero.webp` | Homepage and About handshake/workforce scene |
| `warehouse.png` | `warehouse.webp` | Warehouse cards/detail |
| `transport.png` | `transport.webp` | Transport cards/detail |
| `hospitality.png` | `hospitality.webp` | Hospitality cards/detail |
| `gig.png` | `gig.webp` | Gig Work cards/detail |

All source and runtime files are 1536 × 1024. WebP quality 85/effort 6 reduces transfer size while retaining the supplied composition and colors. Source PNGs remain unchanged. `supplied-workplace-photos.json` records source hashes, dimensions, paths and bytes. Previous `concepts/` files remain historical and are no longer imported by the shared image component.

`npm run photos:sync` refreshes all five optimized copies from the sibling source folder. An optional folder argument supports another explicitly selected source. The website builds independently from its checked-in runtime assets; deployment does not need access to the original asset directory.

## Presentation and provenance

The supplied hero is 3:2 rather than the old 3:1 panorama. Home and About now use a 2:1 desktop frame, with `object-position: center 30%`, preserving the principal faces and handshake. Mobile retains the original 3:2 composition. All four industries keep the same 3:2 image rules and equal card treatment.

English and Hindi alt text describes the new scenes. Existing visible AI-generated concept captions remain at every placement. Pictured brands, locations and people are illustrative; no ARMS client relationship, operational site or staff identity is asserted. The owner did not supply the generating service or prompts, and no such attribution is invented.

Existing design-system, application, authorization, privacy and launch gates are unchanged. This is a local presentation update; no hosted deployment was requested or performed.

## Verification

- Dependency installation, typecheck, lint, production build and handoff validation passed. Three existing localization tests and all 12 local preview route checks passed.
- Browser review measured Home, About, industry index and all four industry details in English/Hindi at 320/768/1440px: 42 distinct checks, one h1 per page, matching image/caption counts and no horizontal overflow. All four industry images loaded successfully and share equal frame dimensions.
- The supplied handshake image was reviewed in the full mobile composition and the new 2:1 desktop frame. English/Hindi alt text and visible AI captions describe the new set. The original PNG hashes still match the source record.
- One browser navigation acknowledgement timed out during automation; the requested page had loaded and was observed before continuing. Subsequent checks completed successfully. This was not an application availability failure.
- Local ignored evidence: `artifacts/qa/supplied-photo-responsive-checks.json`, `supplied-photos-industries-desktop.jpg`, `supplied-photos-english-mobile.jpg` and `supplied-photos-hindi-mobile.jpg`.

The normal local preview remains available at `http://127.0.0.1:3000` while its preview process runs, with public collection, staff authentication and integration/launch flags disabled. No hosted staging or production deployment occurred.
