// Generate PWA icons from SVG
// Run: node scripts/generate-icons.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function generate() {
  const sharp = (await import('sharp')).default;
  const svgBuffer = readFileSync(join(root, 'public', 'icons', 'icon.svg'));

  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(root, 'public', 'icons', `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
  console.log('Done!');
}

generate().catch(console.error);
