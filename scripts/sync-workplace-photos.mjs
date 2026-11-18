import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const website = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(website, process.argv[2] || '../assets/photos');
const output = path.join(website, 'public/photos/supplied');
await mkdir(output, { recursive: true });
const assets = [];
for (const name of ['hero', 'warehouse', 'transport', 'hospitality', 'gig']) {
  const sourcePath = path.join(source, `${name}.png`);
  const original = await readFile(sourcePath);
  const optimized = await sharp(original).resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 }).toBuffer();
  const { width, height } = await sharp(optimized).metadata();
  await writeFile(path.join(output, `${name}.webp`), optimized);
  assets.push({ name, source: path.relative(website, sourcePath),
    output: `public/photos/supplied/${name}.webp`, width, height,
    sourceBytes: original.length, bytes: optimized.length,
    sourceSha256: createHash('sha256').update(original).digest('hex') });
}
await writeFile(path.join(website, 'docs/supplied-workplace-photos.json'), JSON.stringify({
  origin: 'Owner-supplied AI-generated images; creation method confirmed by the owner on 18 November 2026.',
  optimization: { format: 'WebP', quality: 85, effort: 6, maxWidth: 1920 }, assets,
}, null, 2) + '\n');
console.log(`Prepared ${assets.length} supplied photos without changing the originals.`);
