import type { IconName } from '@/components/ui/Icon';

/**
 * Editorial content. Copy and figures are taken verbatim from the
 * BraveHomes brief so the portal and the deck never drift apart.
 */

export const brand = {
  name: 'BraveHomes',
  tagline: 'CONNECTING GENERATIONS',
  footerLine: 'Connecting generations. Helping care homes. Changing lives.',
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
    body: 'Text, a voice note, or a video call — whatever feels comfortable. Nothing to install, nothing to learn.',
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
    body: 'Give £10, £20, £50 — whatever you like. Every penny goes towards helping care homes — improving the places, and the days, of the people who live in them.',
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
    '“If we help just one person feel less alone — every bit of it was worth it.”',
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

/**
 * What a donation goes towards — honest phrasing, because the first
 * homes are not built yet. Everything here is "towards", never "buys".
 */
/**
 * What a gift goes towards — deliberately not what it literally buys.
 * We don't earmark donations to specific items, so the copy never
 * claims one: it goes wherever a care home actually needs it, and the
 * line only scales with how much difference that makes.
 */
export function impactFor(amount: number): string {
  if (amount <= 0) return 'Every amount helps.';
  if (amount < 20) return 'A real help, wherever a care home needs it most.';
  if (amount < 50) return 'A meaningful lift for whatever a care home needs most.';
  if (amount < 100) return 'Real support for the people a care home looks after.';
  return 'A real difference to a care home, and everyone living in it.';
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
  companyNumber: string | null;
  registeredOffice: string | null;
} = {
  registeredName: 'Brave Homes Community Interest Company',
  companyNumber: '17348356',
  registeredOffice: '147 Benhurst Avenue, Hornchurch, England, RM12 4QN',
};
