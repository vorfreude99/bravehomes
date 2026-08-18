/**
 * Prepares the hero photograph for full-bleed use.
 *
 *   npm i --no-save sharp && node scripts/build-hero.mjs
 *
 * The supplied hero.png is 1024px wide. Next/image never upscales past
 * the source, so on a 1440px viewport the browser was stretching a
 * small variant across the whole screen with plain bilinear filtering —
 * which is what the softness was.
 *
 * Resampling here with Lanczos and re-sharpening cannot invent detail
 * that was never captured, but it is markedly cleaner than letting the
 * browser stretch it, and it lets Next serve a variant at the size the
 * layout actually needs. A higher-resolution original is still the real
 * fix; drop one in as public/hero.png and re-run this.
 */
import sharp from 'sharp';

const SRC = 'public/hero.png';
const OUT = 'public/hero-2048.jpg';
const TARGET = 2048;

const meta = await sharp(SRC).metadata();
console.log(`source: ${meta.width}x${meta.height}`);

await sharp(SRC)
  .resize(TARGET, null, { kernel: 'lanczos3', fit: 'inside', withoutEnlargement: false })
  // Restores the edge contrast that any upscale costs. Kept gentle —
  // heavier settings start haloing around the window frames.
  .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 })
  .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log(`wrote ${OUT}: ${out.width}x${out.height}`);
