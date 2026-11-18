# 02 · Design and interaction system

## Current owner handoff — 17 November 2026

**Imperial Burgundy + Champagne**, from `../../design-system/ARMS_Design_System.md` and its visual guide. This replaces the older teal palette and Arial/Manrope/Inter proposal. Identity stays **Premium + Bold + Human**; the editorial story, audience parity, four-sector parity, bilingual UI and collection/launch gates remain.

The source of truth is `../../design-system/tokens/arms-tokens.css`. Run `npm run design:sync` to copy its full token set, Montserrat faces and supplied logo artwork into the website. `app/arms-tokens.css` differs only by its generated-file comment and local font URLs. The deployable site needs no files outside this repository.

## Palette

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#F4EDE6` | Light beige canvas |
| `--color-bg-card` | `#FFFFFF` | Cards and inputs |
| `--color-bg-inverse` | `#4A0016` | Statement/closing sections |
| `--arms-maroon-950` | `#2C000D` | Footer |
| `--color-action` | `#8B0724` | Primary controls and brand emphasis |
| `--color-action-hover` | `#4A0016` | Primary hover |
| `--color-action-alt` | `#D8C4A3` | Champagne controls on burgundy |
| `--color-bg-accent` | `#EEE3D1` | Preview banner/contact panel |
| `--color-text` | `#222222` | Body copy |
| `--color-text-heading` | `#4A0016` | Headings |
| `--color-text-sub` | `#51474A` | Secondary copy |
| `--color-rule-accent` | `#BC9D6D` | Decoration |
| `--color-text-accent-on-light` | `#7A5C2E` | Bronze text on beige |

Logo gold stays in the supplied artwork and focus rings on dark surfaces. No large bright-yellow fields or gold body text on light surfaces. Errors use the separate `--arms-error` token; warnings and success messages keep their semantic status colors.

## Typography, spacing and components

- Self-hosted **Montserrat** Regular/Italic/Medium/SemiBold/Bold; **Noto Sans Devanagari** for Hindi glyphs. `font-display: swap`, no external font request. Hindi keeps zero heading tracking and taller line heights for matras.
- Fluid source scale: Display 40–80px, H1 36–60px, H2 28–44px, H3 22–30px; 16px body, 14px small and 12px captions/eyebrows. The narrowest mobile hero adapts further for readable wrapping.
- 4px spacing base, 1280px main/780px narrow containers, section padding from `--section-y` (64–112px). Preserve the established 1180/940/650px responsive behavior.
- Controls have 4px corners, cards 8px. Primary controls use maroon; closing-section controls use champagne. Employers and candidates keep equal CTA dimensions and prominence.
- Audience cards are white and inverse maroon. Industry cards share equal image dimensions, border/rule treatment and responsive rows. Lifecycle steps use a champagne connector and burgundy markers.
- Header uses `public/brand/arms-wordmark.webp`; footer uses the reverse artwork directly on deep burgundy. Do not regenerate or trace the logos. `app/icon.png` is the supplied new symbol.
- At most one signature sweep per page: the homepage image has the handoff’s thin champagne/maroon device.
- Hover transitions use source motion tokens; reduced-motion preference disables transitions/animations.

## Hero and imagery

Maintain the typography-led editorial hero (~65% content emphasis/35% image emphasis), the exact headline **Great people. Greater possibilities.**, and tagline **Together for a Better Tomorrow**. Keep two equal Hire Workforce/Find Work actions and the owner’s supplied workforce handshake image below the copy.

Use the owner’s latest `assets/photos/` images without recoloring them; deployable WebP copies live in `public/photos/supplied/` (docs/29). Home/About use a 2:1 desktop frame with a face-safe upper-center crop and a full 3:2 mobile frame. Every generated image keeps its visible AI concept caption and illustrative alt text in both languages. All four industries — Warehousing & Fulfillment, Transportation & Drivers, Cafés & Hospitality and Gig Work — keep equal visual weight. See docs/16 for provenance; supplied mockups are not operational photographs.

## Accessibility and boundaries

Target WCAG 2.2 AA: test text/control contrast, 320–1440px reflow, both languages, keyboard menu/Escape/focus return, skip link, labels, status messages and reduced motion. Input borders use the muted plum token to remain visible on white. Focus uses maroon on light and logo gold on dark. A full human screen-reader audit remains separate from automated/browser checks.

This design application changes presentation only. Secure collection, protected staff authorization, real vacancies, privacy approval and public launch remain governed by their existing gates. Current verification is recorded in docs/28.
