# Generated concept imagery — 14 November 2026

The owner requested generated imagery because approved workplace photos are not yet available. Four original images were created using the built-in image generation tool. These are fictional people and workplaces, not documentary photos of ARMS employees, clients or facilities. No supplied logo or brand reference was modified.

## Files and placement

| Optimized project asset | Placement | Original dimensions |
| --- | --- | --- |
| `public/photos/concepts/hero.webp` | Home panorama and About concept | 2172 × 724 |
| `public/photos/concepts/warehouse.webp` | Warehouse index/detail | 1536 × 1024 |
| `public/photos/concepts/transport.webp` | Transport index/detail | 1536 × 1024 |
| `public/photos/concepts/hospitality.webp` | Hospitality index/detail | 1536 × 1024 |

All three industry assets have the same dimensions, optimization quality, image-area rules and caption treatment. Every placement must visibly disclose that it is an AI-generated concept and describe it as illustrative in alt text. Hero reuses a neutral workforce-coordination scene, not an industry-specific lead image. Mobile crops preserve the central activity.

## Source and usage record

- Source: original AI generation at the owner's request in this chat; no third-party stock photograph was used.
- Original PNGs remain in the chat's generated image output folder; optimized WebP copies are part of this project.
- There are no real subject/site releases for these fictional scenes; do not describe them as approved operational photography.
- Owner review of the concepts is pending. Generation is not legal or launch sign-off, and does not establish exclusive rights or guarantee clearance.
- The genuine photography, permissions and launch-approval requirements in docs/08 and docs/10 remain open. If the owner wants generated imagery in the public launch, record that decision explicitly and retain the disclosures.
- Exact generation prompts are recorded in `docs/image-generation-prompts.json`.


## Owner refresh — 14 November 2026

A new original handshake/workforce/gig-worker panorama replaces the earlier hero in runtime use: `public/photos/concepts/hero-partnership.webp` (2172 × 724; 211,854 bytes). A fourth equal industry image is `public/photos/concepts/gig.webp` (1536 × 1024; 238,484 bytes). Both were generated with the built-in image-generation tool and optimized as WebP at quality 85. The original hero file is retained, unused, for traceability; five concept assets are now active. Both new outputs were visually inspected.

The owner specifically requested a handshake/manpower-agency/gig-worker subject. It is a fictional partnership scene in brand-adjacent teal/ivory tones, with a central handshake retained in the measured mobile crop. The Gig image has the same card dimensions and presentation as the other sectors. English and Hindi captions and alt text disclose AI generation; none is presented as actual ARMS staff, clients or premises. Real usage permissions/operational authenticity and launch approval remain open. Final saved paths, original output paths and exact prompts are recorded in `image-generation-prompts-refresh.json`; implementation evidence is in docs/22.

## Indian workplace refresh — 17 November 2026

The owner requested rebuilding **all workplace photos** with realistic Indian people. All five active files above were replaced using the built-in image generation tool. The homepage/About scene now shows an Indian female staffing coordinator welcoming a gig worker at a workforce office; the four industry scenes show parcel scanning/packing, route planning at a parked goods truck, café service and a motorcycle delivery pickup. The brief favors candid everyday Indian settings, distinct people, natural skin texture, normal daylight and practical workwear.

| Active file in `public/photos/concepts/` | Dimensions | WebP bytes |
| --- | --- | --- |
| `hero-partnership.webp` | 2172 × 724 | 138,134 |
| `warehouse.webp` | 1536 × 1024 | 175,456 |
| `transport.webp` | 1536 × 1024 | 149,906 |
| `hospitality.webp` | 1536 × 1024 | 169,962 |
| `gig.webp` | 1536 × 1024 | 163,066 |

The originals were visually inspected and optimized at WebP quality 85, effort 6. Exact prompts, original source paths, final asset paths and provenance are recorded in `image-generation-prompts-indian-refresh.json`. All existing placements reuse the replacement assets. Industry detail images use a taller 16:10 desktop frame to preserve faces and working hands; cards/mobile retain 3:2 and the homepage panorama retains 3:1 on desktop. English/Hindi alt text describes the new scenes. Visible AI concept captions remain at every placement. These are photorealistic fictional scenes, not genuine photographs of ARMS operations. The unused original `hero.webp` remains untouched. This asset refresh does not enable collection or authorize public launch.

Verification: typecheck, lint, production build, handoff validation, three existing localization tests and whitespace checks passed. Browser review at 1440px and 360px confirmed equal industry image frames, no horizontal overflow, loaded replacement images, the 16:10 industry detail frame and translated Hindi alt text/captions. The homepage mobile crop retains both faces and the handshake. Local screenshots are in `artifacts/qa/indian-refresh-*`; the shareable homepage screenshot is `artifacts/qa/indian-workplace-refresh-preview.jpg`. The temporary preview server was stopped after review. No hosted staging or public deployment was performed.


## Candid, organic photo replacement — 18 November 2026

The owner asked to make the photography more organic and replace all photos. Replaced all five active image files using built-in image generation. The latest set uses natural available light, ordinary workwear, realistic skin/material texture and everyday individual tasks rather than coordinated advertising poses. Homepage and About reuse the new office conversation scene; every four-sector placement uses its new matching asset.

| Active file in `public/photos/concepts/` | Scene | Dimensions | WebP bytes |
| --- | --- | --- | --- |
| `hero-partnership.webp` | Coordinator and worker exchanging a sheet during an office conversation | 2172 × 724 | 137,890 |
| `warehouse.webp` | Worker folding a carton; coworker shelving a box | 1536 × 1024 | 178,236 |
| `transport.webp` | Driver checking a seat belt in a stationary goods van | 1536 × 1024 | 119,020 |
| `hospitality.webp` | Café server setting down a cup while a colleague cleans | 1536 × 1024 | 113,152 |
| `gig.webp` | Delivery partner securing a bag on her parked scooter | 1536 × 1024 | 162,406 |

All five originals were visually inspected and encoded as WebP at quality 85, effort 6. Exact final prompts and original/final paths are recorded in `image-generation-prompts-organic-refresh.json`; original generated files remain in place. The previous 17 November prompt record is historical. The unused original `hero.webp` is not rendered and was left untouched.

English/Hindi alt text now describes the new scenes. Existing visible AI concept captions remain at every placement; documentary style does not establish operational authenticity. The shared desktop industry-detail frame now uses the original 3:2 ratio, matching cards/mobile and preserving working hands and objects in these closer compositions. All four sectors retain the same image rules. The homepage retains 3:1 desktop/3:2 mobile framing and the updated Burgundy + Champagne design system.

This is a local image/presentation update. It does not change collection, privacy or launch gates, and no hosted deployment is implied. Verification: install, typecheck, lint, production build, handoff validation, three localization tests and all 12 existing preview HTTP checks passed. Browser review covered Home, About, industry index and all four industry details in English/Hindi at 320/360/768/1440px (56 measurements): no horizontal overflow, one h1 per page, matching image/caption counts, and translated Hindi alt text. The four industry frames remain equal; new assets loaded in the industry index, and the mobile hero retains both faces and the paper handover. Three browser navigation acknowledgements timed out during automation; the requested pages had loaded and were measured after refreshing the observed browser state. No website availability failure was observed.

Saved local evidence: `artifacts/qa/organic-photo-responsive-checks.json`, `organic-photos-homepage-desktop.jpg`, `organic-photos-industries-desktop.jpg`, `organic-photos-english-mobile.jpg` and `organic-photos-hindi-mobile.jpg`. The local preview was restarted with the existing collection/authentication/integration gates disabled and returned to English for owner review. No production/staging deployment, real-data collection or provider change was made.


## Owner-supplied image set — 18 November 2026

The owner subsequently replaced all five source images in `../assets/photos/` and requested using that set in the website. They explicitly confirmed the images are AI-generated. Current runtime images now live in `public/photos/supplied/`; the earlier `concepts/` sets and prompt records above are historical. No new image generation was performed for this replacement. Source files, optimization, placement and verification are recorded in docs/29 and `supplied-workplace-photos.json`. English/Hindi concept disclosures remain visible.
