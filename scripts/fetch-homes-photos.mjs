/**
 * Pulls the stock photography for the homes section from Unsplash.
 *
 *   npm i --no-save sharp && node scripts/fetch-homes-photos.mjs
 *
 * These are real photographs under the Unsplash licence, used as
 * stand-ins until Brave Homes has pictures of its own sites. Swap the
 * files in public/homes/ for the real ones and nothing else changes.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const PHOTOS = [
  // A brick building mid-works, scaffold and crane up.
  { name: 'works', id: '1699021565888-473cb9491837', width: 1400 },
  // An older couple outside their front door.
  { name: 'couple', id: '1658314755707-1fbdf7c40145', width: 1400 },
  // Children outside, for the overseas children's homes.
  { name: 'children', id: '1763735135003-6710ca6872ea', width: 1400 },
];

await mkdir('public/homes', { recursive: true });
for (const p of PHOTOS) {
  const res = await fetch(`https://images.unsplash.com/photo-${p.id}?w=${p.width}&q=85&fm=jpg`);
  if (!res.ok) throw new Error(`${p.name}: ${res.status}`);
  await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width: p.width, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`public/homes/${p.name}.jpg`);
  console.log(p.name);
}
