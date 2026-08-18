import type { IconName } from '@/components/ui/Icon';

/**
 * Editorial content. Copy and figures are taken verbatim from the
 * BraveHomes brief so the portal and the deck never drift apart.
 */

export const brand = {
  name: 'BraveHomes',
  tagline: 'CONNECTING GENERATIONS',
  footerLine: 'Connecting generations. Building homes. Changing lives.',
} as const;

export type Step = {
  id: string;
  /** Name in the shared icon set — not an emoji. See ui/Icon.tsx. */
  icon: IconName;
  title: string;
  body: string;
};

export const steps: Step[] = [
  {
    id: 'profile',
    icon: 'profile',
    title: 'Create your profile',
    body: 'Sign up in seconds. Just your name and a little about yourself. Big buttons, simple symbols — easy for every age.',
  },
  {
    id: 'conversation',
    icon: 'chat',
    title: 'Start a conversation',
    body: 'Text, voice message, or video — whatever feels comfortable. AI translation means any language works.',
  },
  {
    id: 'coffee',
    icon: 'coffee',
    title: 'Meet for coffee',
    body: 'If you’re in the same city, arrange to meet in person. Real friendships, not just digital ones.',
  },
  {
    id: 'donate',
    icon: 'heart',
    title: 'Donate — 100% to the cause',
    body: 'Give £10, £20, £50 — whatever you like. Every single penny goes directly to building care homes. Not one penny to admin.',
  },
];

export type Project = {
  id: string;
  /** Drawn as an SVG flag — emoji flags don't render on Windows. */
  region: 'uk' | 'global';
  name: string;
  status: string;
  /** Index into `BUILD_STAGES` — how far this build has actually got. */
  stage: number;
  /**
   * A photograph of the site, in `public/homes/`. Leave it off until
   * there is a real one — the register shows an honest empty frame
   * rather than a stand-in image.
   */
  photo?: string;
  raised: number;
  goal: number;
  /** Latitude / longitude, used to place the marker on the globe. */
  lat: number;
  lon: number;
};

/**
 * ⚠️ PLACEHOLDER NAMES AND LOCATIONS.
 *
 * Brave Homes is UK-based. The names, statuses and coordinates below are
 * stand-ins so the page has something real-shaped to render — they are
 * NOT confirmed sites, and neither are the build stages. Replace them
 * with the actual builds before this
 * goes anywhere near a donor. The money figures are carried over from
 * the existing site and should be confirmed too.
 */
/**
 * The stages every build passes through, in order. Publishing where each
 * one has reached is the thing a donor actually wants to know, and it is
 * something only a real charity can show.
 */
export const BUILD_STAGES = [
  'Land',
  'Planning',
  'Groundwork',
  'Build',
  'Fit-out',
  'Open',
] as const;

export const projects: Project[] = [
  {
    id: 'uk-home-1',
    region: 'uk',
    name: 'Care Home One',
    status: 'Site secured — under construction',
    stage: 3,
    raised: 31200,
    goal: 50000,
    // Roughly central England until the real site is confirmed.
    lat: 52.4862,
    lon: -1.8904,
  },
  {
    id: 'uk-home-2',
    region: 'uk',
    name: 'Care Home Two',
    status: 'Land purchase in progress',
    stage: 0,
    raised: 8400,
    goal: 30000,
    lat: 53.4808,
    lon: -2.2426,
  },
  {
    id: 'childrens-overseas',
    region: 'global',
    name: "Children's Homes — Overseas",
    status: 'Wherever the need is greatest',
    stage: 1,
    raised: 18900,
    goal: 42000,
    lat: 0.3476,
    lon: 32.5825,
  },
];

export const values = [
  { label: 'Grateful' },
  { label: 'Honest' },
  { label: 'Loyal' },
  { label: 'Brave' },
] as const;

export const manifesto = {
  eyebrow: 'WHY WE EXIST',
  quote:
    '“If we help just one person feel less alone — every brick we’ve laid was worth it.”',
  body: 'Elderly people are living longer but lonelier. Young people are searching for meaning behind their screens. Brave Homes is the bridge between them — and the homes that give people somewhere safe to belong.',
} as const;

/**
 * The two halves of the problem, and what joins them. Restated from
 * `manifesto.body` so the closing section can lay the argument out as a
 * diptych instead of a paragraph — no claim here that is not already in
 * the brief.
 */
export const bridge = {
  left: {
    label: 'Older people',
    line: 'Living longer than ever. Lonelier than ever.',
  },
  right: {
    label: 'Younger people',
    line: 'Searching for meaning behind a screen.',
  },
  join: 'Brave Homes is the bridge between them — and the homes that give people somewhere safe to belong.',
} as const;

export const donationTiers = [10, 20, 50, 100] as const;

/** What one donation actually buys — shown next to the amount. */
export function impactFor(amount: number): string {
  if (amount <= 0) return 'Every amount helps.';
  if (amount < 20) return 'A week of hot meals for one resident.';
  if (amount < 50) return 'Bedding and warm blankets for a new room.';
  if (amount < 100) return 'A window frame for the first care home.';
  if (amount < 500) return `${Math.floor(amount / 25)} square metres of finished floor.`;
  return `A full room, furnished — about ${Math.floor(amount / 500)} of them.`;
}

export const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

/**
 * ⚠️ REQUIRED BEFORE LAUNCH, AND DELIBERATELY EMPTY.
 *
 * A charity registered in England and Wales must state its registered
 * name and charity number on any material soliciting donations
 * (Charities Act 2011, s.39). Invented numbers are worse than none, so
 * the footer prints these lines only once they are filled in.
 */
export const registration: {
  registeredName: string | null;
  charityNumber: string | null;
  registeredOffice: string | null;
} = {
  registeredName: null,
  charityNumber: null,
  registeredOffice: null,
};
