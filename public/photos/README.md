# Workplace imagery

The five active website images are optimized copies of the owner’s files in `../../../assets/photos/`: `hero.png`, `warehouse.png`, `transport.png`, `hospitality.png` and `gig.png`. The owner confirmed on 18 November 2026 that these images are AI-generated. Visible English/Hindi concept captions remain at every placement; the images do not establish that the pictured people, workplaces or brands belong to ARMS.

Runtime assets are `supplied/hero.webp`, `supplied/warehouse.webp`, `supplied/transport.webp`, `supplied/hospitality.webp` and `supplied/gig.webp`. All are 1536 × 1024, encoded at WebP quality 85/effort 6. The original PNGs are left unchanged. Home and About share `hero.webp`; industry cards and detail pages use their matching image.

Run `npm run photos:sync` after replacing the five files in the source folder. The script copies/optimizes the supplied files and refreshes `docs/supplied-workplace-photos.json` with paths, dimensions, byte counts and source hashes. Its optional argument selects a different source folder. Builds use the checked-in runtime copies and do not require the sibling assets folder.

The hero/About desktop frame is 2:1 with an upper-centered focal position so the new handshake composition keeps faces and hands visible. Mobile and industry images retain 3:2 frames. Previous generated images in `concepts/` are historical and no longer rendered. See `docs/29-SUPPLIED-WORKPLACE-PHOTOS.md` for the current source/usage record; docs/16 and the older prompt JSON files record previous generated sets.

This local preview update does not change the project’s public collection or launch gates.
