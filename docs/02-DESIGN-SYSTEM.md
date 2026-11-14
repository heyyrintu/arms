# 02 · Design and interaction system

## Identity
**Premium + Bold + Human**. Bold editorial typography, generous whitespace, powerful authentic photography and very restrained gold detailing. Avoid generic staffing and SaaS templates.

## Color tokens (website working values, confirm against final brand masters)
| Token | Hex | Usage |
|---|---|---|
| Deep teal | `#073F43` | Primary text, buttons, dark sections |
| Teal | `#0C777C` | Accessible emphasis on pale backgrounds, links |
| Gold | `#CDA23E` | Sparse accent lines/details only |
| Warm ivory | `#F6F3EB` | Primary canvas |
| Off-white | `#FFFCF7` | Alternating editorial panels |
| Charcoal/subtext | `#506564` | Body copy on light backgrounds |

Prototype uses system Arial/Helvetica for zero external font dependency. Proposed approved web fonts: Manrope for headline and Inter for body, self-hosted/loaded with optimization after licensing and build testing. Keep the wordmark graphic unchanged; **do not regenerate brand logo with AI**.

## Hero
- Editorial Hero, typography-dominant: approximately **65% content emphasis** / **35% photo emphasis**, not a rigid CSS width split.
- Warm ivory. Left-aligned two-line main headline; confident dark teal; genuine operational panorama below copy.
- Eyebrow: `WORKFORCE MANAGEMENT & CAREER OPPORTUNITIES`.
- Headline: `Great people. / Greater possibilities.`
- Short support copy; two equal dark, visible CTAs: **Hire Workforce** and **Find Work**.
- One wide photograph: people working, team coordination, operational scale; no text overlays over faces.
- Desktop spacing concept: side margins 64–88 px at 1440 width; header 72–84 px; headline 72–88 px; 24–32 px title-to-description gap; 32–40 px text-to-action gap; 44–64 px action-to-photo gap. These are *starting targets* and must be adjusted after testing.
- On mobile: headline 38–46 px where possible, concise copy, two large stacked CTAs, intentional crop showing people, readable without animation.

## Photography
- **People at Work**; **Powerful & Ambitious**; cinematic editorial realism, eye-level/slightly low, controlled directional natural light, medium-high realistic contrast.
- Real workplaces, real skills, dignity and movement. Prefer company-owned, permissioned imagery. No fake group photos or false implication of endorsement/employment.
- Give **equal image scale, effort and placement** to all three industries.
- Never expose confidential documents, employee records, unsafe operational practices or people without consent.
- The original `PhotoSlot` placeholders have been replaced in preview by visibly disclosed generated concepts (`WorkplaceImage`) at the owner’s request; **genuine approved/licensed photography remains a launch requirement**. See `16-GENERATED-IMAGERY.md`.

## Components and motion
- Clean header, purposeful dropdowns (future), contrast-safe buttons, large editorial images, short strategic statement sections, clear cards only where they aid comprehension.
- Subtle reveal/hover, no image carousel or autoplay video required; respect `prefers-reduced-motion` and avoid scroll traps.
- Gold orbital form from the provided brand icon can inform a *very sparse* connective line, not spinning star visuals.

## Accessibility
- Target WCAG 2.2 AA, verify text contrast, native inputs/labels, focus rings, skip link, keyboard navigation, aria-live form messages, proper alt text, 44×44 target goal, no information conveyed by color alone.


## Owner-directed brand and language update — 14 November 2026

The owner explicitly added **Gig Work** as a fourth industry alongside Warehousing & Fulfillment, Transportation & Drivers and Cafés & Hospitality, with equal prominence. They requested a credible handshake/manpower/gig-worker hero, an expanded About with mission and vision, **Career** instead of Join Talent Network, and Hindi/English across the web app. These instructions supersede earlier three-sector, earlier hero-subject and language-pending descriptions in this document; they do not change payroll-by-contract, audience parity, authenticity, security or launch gates. Current implementation and evidence: docs/22.
