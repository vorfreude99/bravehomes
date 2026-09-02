# Brave Homes — web portal

Connecting generations. Building homes. Changing lives.

A Next.js 16 portal with a WebGL layer, built from the Brave Homes brief.
The old Vite marketing site is preserved untouched in [`legacy/`](legacy/).

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

Credentials live in `.env.local` (already populated with the existing
Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

## What's here

**Public site** — `/`, `/about`, `/contact`
Hero, how-it-works, donate, the homes, and the manifesto, following the brief.

**Portal** — `/portal`, guarded by `src/proxy.ts`
The five tabs from the product design: Chat, Find, Homes, Donate, Profile.

- **Chat** — real conversations against the `messages` table, with Supabase
  realtime so replies land without a refresh.
- **Find** — search and age-filter over `profiles`.
- **Homes** — the 3D globe plus per-project funding detail.
- **Donate** — amount picker wired to the brick wall.
- **Profile** — edits `profiles`, with a live preview of how others see you.

## The 3D layer

Four scenes in `src/components/three/`, all procedural — there are no model
or texture files to download, so nothing can 404 in production.

| Scene | Where | What it shows |
|---|---|---|
| `HeroScene` | landing hero | Warm sky and drifting pollen behind the hero photograph. Pass `showIsland` for the full version — a home on a floating island with lit windows — which needs room for the whole island to read |
| `ConstellationScene` | "Why we exist" | Two generations as two point clusters, bridged by travelling pulses |
| `GlobeScene` | the homes | Dotted globe, gold site markers whose height is funding progress |
| `BrickScene` | donate | Your amount lays bricks in real time — £5 a brick |

Every scene goes through `Stage`, which owns three guarantees:

1. **It never mounts WebGL that the visitor didn't ask for.** The tier starts
   at `off` and only lights up once the device has been measured. Reduced-motion
   users, and anyone without a WebGL context, get the SVG fallbacks in
   `Fallbacks.tsx` — which are designed, not degraded.
2. **DPR is clamped per tier**, so a retina laptop doesn't quietly render 4×
   the pixels it needs.
3. **The wrapper element is stable** — the fallback and the canvas swap
   *inside* one div. (Swapping the root element instead silently broke the
   scroll-reveal observer, which had registered the element that got replaced.)

Scene detail scales off the same tier via `useDetail()`.

## Accessibility

The brief's promise is "whether you're 18 or 88", so this is load-bearing,
not a checklist:

- **Easy view** (`SettingsProvider`) — a real mode, not a zoom. It raises the
  root font size, grows every tap target via `--bh-tap`, thickens focus rings,
  and drops decorative motion. It persists across sessions.
- Every interactive element is at least `--bh-tap` tall by construction —
  it's baked into the shared `Button`, not applied case by case.
- Focus rings are never removed, only restyled.
- `prefers-reduced-motion` disables smooth scrolling, scroll reveals, and all
  WebGL.
- Progress bars carry `role="progressbar"` with real values; the canvases are
  `aria-hidden` because their meaning is always in the adjacent prose.
- Flags are drawn as SVG. Emoji flags render as bare letters ("LT") on Windows,
  which is a large share of visitors.

## Hero photograph

The supplied `public/hero.png` is **1024×732**, which is small for a
full-bleed hero — the browser was stretching it across the whole screen.
`scripts/build-hero.mjs` resamples it to `public/hero-2048.jpg` (Lanczos
plus a gentle re-sharpen), which is what `SplitHero` actually loads.

```bash
npm i --no-save sharp && node scripts/build-hero.mjs
```

**Upscaling cannot add detail that was never captured.** If you can get
the original at 2400px wide or more, replace `public/hero.png`, re-run
the script, and it will sharpen further — especially on retina screens,
where 2048px is still being stretched.

Two other things were softening it, both fixed and worth not
reintroducing:

- A continuously-updated `transform: scale()` on a `will-change` layer.
  Chrome rasterises such a layer once and stretches the texture on the
  GPU, so the photo blurred independently of its resolution.
- `next/image` only honours `quality` values listed in
  `images.qualities` in `next.config.mjs`; anything else silently falls
  back to 75.

## Logo

The mark comes from `public/logo-icon.jpeg`. That file sits on an opaque
near-white plate, which shows as a pale box against the cream page, so
`scripts/build-logo.mjs` knocks the plate out and writes:

- `public/logo-icon.png` — transparent, trimmed, used by `BrandMark`
- `src/app/icon.png` — the browser-tab / app icon

Only re-run it if the source artwork is replaced:

```bash
npm i --no-save sharp && node scripts/build-logo.mjs
```

`sharp` is deliberately not a project dependency — it is build-time only.

## Supabase

Already in use: `profiles` and `messages`.

**Not yet created: `pledges`.** The donate flow writes to it and handles its
absence gracefully — the UI tells you the table is missing rather than
pretending the pledge saved. To enable it:

```sql
create table pledges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount numeric not null,
  project_id text not null,
  created_at timestamptz default now()
);
alter table pledges enable row level security;
create policy "own pledges" on pledges
  for all using (auth.uid() = user_id);
```

## Known gaps

These need your input rather than more code:

- **No payment provider.** Donate records an *intent* and says so plainly on
  screen. Wiring Stripe (or similar) is the next step — the amount and project
  are already captured.
- **Project funding figures are static**, taken from the brief
  (`src/lib/content.ts`). They should move to Supabase once the team wants to
  update them without a deploy.
- **Voice and video messages** are advertised in the brief and surfaced in the
  UI as "coming soon". Text and AI translation display are in place; the
  translation itself is not wired to a provider.
- **Contact address** on `/contact` is `support@bravehomes.co.uk`.
