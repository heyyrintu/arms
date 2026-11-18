import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Keep the deployable website self-contained; the design handoff lives beside it.
const website = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(website, process.argv[2] || '../design-system');
const fonts = ['Regular', 'Italic', 'Medium', 'SemiBold', 'Bold'];
await mkdir(path.join(website, 'public/fonts'), { recursive: true });
await mkdir(path.join(website, 'public/brand'), { recursive: true });
for (const face of fonts) {
  const filename = `Montserrat-${face}.subset.woff`;
  await copyFile(path.join(source, 'assets/fonts', filename), path.join(website, 'public/fonts', filename));
}
await copyFile(path.join(source, 'assets/fonts/OFL.txt'), path.join(website, 'public/fonts/Montserrat-OFL.txt'));
for (const [from, to] of [
  ['logo-primary.webp', 'arms-wordmark.webp'],
  ['logo-reverse.webp', 'arms-wordmark-reverse.webp'],
  ['symbol.webp', 'arms-symbol.webp'],
]) {
  await copyFile(path.join(source, 'assets/logo', from), path.join(website, 'public/brand', to));
}
await copyFile(path.join(source, 'assets/logo/symbol.png'), path.join(website, 'app/icon.png'));
const tokens = await readFile(path.join(source, 'tokens/arms-tokens.css'), 'utf8');
await writeFile(path.join(website, 'app/arms-tokens.css'),
  '/* Synced by scripts/sync-design-system.mjs. Edit the source design-system tokens first. */\n' +
  tokens.replaceAll('../assets/fonts/', '/fonts/'));
console.log('Synced ARMS tokens, Montserrat fonts, primary/reverse logos and favicon.');
