/**
 * Regenerates the logo assets from the supplied artwork.
 *
 *   npm i --no-save sharp && node scripts/build-logo.mjs
 *
 * Only needs re-running if public/logo-icon.jpeg is replaced. `sharp` is
 * deliberately not a project dependency — it is build-time only.
 */
import sharp from 'sharp';

const SRC = 'public/logo-icon.jpeg';
const OUT = 'public/logo-icon.png';

// The JPEG ships on a flat near-white plate (~#f5f5f5). Knock that out so
// the mark sits on the cream page instead of inside a pale box. A soft
// band rather than a hard cutoff keeps the antialiased edges clean.
const BG = { r: 245, g: 245, b: 245 };
const SOLID = 62; // distance beyond which a pixel is fully the logo
const CLEAR = 18; // distance below which a pixel is fully background

const { data, info } = await sharp(SRC)
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const out = Buffer.alloc(width * height * 4);

for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  const d = Math.hypot(r - BG.r, g - BG.g, b - BG.b);
  let alpha;
  if (d <= CLEAR) alpha = 0;
  else if (d >= SOLID) alpha = 255;
  else alpha = Math.round(((d - CLEAR) / (SOLID - CLEAR)) * 255);

  out[o] = r;
  out[o + 1] = g;
  out[o + 2] = b;
  out[o + 3] = alpha;
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .trim() // drop the transparent margin so the mark fills its box
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT}: ${meta.width}x${meta.height}`);

// Square favicon/app icon, padded so the mark isn't cropped.
await sharp(OUT)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 251, g: 243, b: 231, alpha: 1 },
  })
  .png()
  .toFile('src/app/icon.png');
console.log('wrote src/app/icon.png: 512x512');
