import type { Metadata, Viewport } from 'next';
import { Caveat, Newsreader, Public_Sans } from 'next/font/google';
import './globals.css';
import { ScrollToTop } from '@/components/site/ScrollToTop';

/**
 * Public Sans for the interface, Newsreader for display.
 *
 * Public Sans was commissioned for US government services with
 * legibility and accessibility as the brief — open apertures, a generous
 * x-height, unambiguous letterforms. That is the same problem this
 * product has: it must be readable at 88, not just handsome at 28.
 *
 * Newsreader is an editorial screen serif with a true optical-size axis
 * and real warmth, and it is uncommon enough not to read as a template.
 */
const sans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans-brand',
  display: 'swap',
});

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif-brand',
  display: 'swap',
  // Lower contrast than a Didone, so it carries weight comfortably and
  // headings do not have to sit at 400 to stay elegant.
  axes: ['opsz'],
});

/**
 * A real hand, for the one line that should sound like a person said it
 * rather than a typesetter did. Caveat over a script/cursive face
 * because it stays legible at speed — open counters, unjoined-enough
 * strokes — which matters more here than looking precious.
 */
const hand = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-hand-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bravehomes.org'),
  title: {
    default: 'Brave Homes — Connecting Generations',
    template: '%s · Brave Homes',
  },
  description:
    'Brave Homes connects generations and helps care homes look after the people in them. Every penny of every donation goes to the cause.',
  openGraph: {
    title: 'Brave Homes — Connecting Generations',
    description:
      'Connecting generations. Building homes. Changing lives. 100% of donations go directly to the cause.',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#fbf3e7',
  width: 'device-width',
  initialScale: 1,
  // Never trap the user at one zoom level — many of them will need it.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${sans.variable} ${serif.variable} ${hand.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* Every route needs this, not just the marketing pages it was
            first built for — landing on /signup or /login with the home
            page's scroll position still in the document was exactly this
            bug, just on a route this component never covered. One
            instance here beats one per route group, since that's how the
            gap opened in the first place: the (auth) layout was simply
            never given a copy. */}
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
