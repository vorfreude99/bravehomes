import type { Metadata } from 'next';
import { Eyebrow, LinkButton } from '@/components/ui/Button';
import { manifesto, bridge, values } from '@/lib/content';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Brave Homes connects generations and helps care homes look after the people in them. Every penny of every donation goes to the cause.',
};

/** A line for each value, so they read as promises rather than posters. */
const VALUE_LINES: Record<string, string> = {
  Grateful: 'For every hello, every hour, every pound. None of it is owed to us.',
  Honest: 'We would rather show you an honest beginning than an invented finish line.',
  Loyal: 'To the people who show up here — not to numbers on a chart.',
  Brave: 'It takes courage to say hello first. This whole place runs on it.',
};


/**
 * A hand-thrown paint splat — organic blob plus loose droplets. Purely
 * decorative: hidden from screen readers and untouchable by the pointer.
 */
function Splash({
  className,
  color,
  size,
  rotate = 0,
  flip = false,
  edge,
  bleed = 0,
}: {
  className: string;
  color: string;
  size: number;
  rotate?: number;
  flip?: boolean;
  /** Pin to the viewport edge (not the text column), bleeding off-screen. */
  edge?: 'left' | 'right';
  bleed?: number;
}) {
  // (100% - 100vw) / 2 is the distance from the column to the screen
  // edge, whatever the screen is — so the paint hugs the glass itself.
  const pin =
    edge === 'left'
      ? { left: `calc((100% - 100vw) / 2 - ${bleed}px)` }
      : edge === 'right'
        ? { right: `calc((100% - 100vw) / 2 - ${bleed}px)` }
        : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={`decorative splash-breathe pointer-events-none absolute ${className}`}
      style={{ transform: `rotate(${rotate}deg)${flip ? ' scaleX(-1)' : ''}`, ...pin }}
    >
      <path
        fill={color}
        d="M48 12c9-3 21-2 27 5 5 6 3 13 8 19 5 5 9 11 6 19-3 9-12 10-18 16-5 5-4 14-12 16-9 3-14-5-23-6-8 0-17 2-22-5-5-8 2-14 2-22 0-7-6-14-1-21 4-7 12-6 18-11 5-4 8-8 15-10Z"
      />
      <circle fill={color} cx="88" cy="26" r="5" />
      <circle fill={color} cx="14" cy="20" r="3.4" />
      <circle fill={color} cx="90" cy="64" r="2.6" />
      <circle fill={color} cx="8" cy="72" r="4.2" />
      <circle fill={color} cx="70" cy="93" r="3" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Behind the content: colour soaking through the paper. */}
      <Splash className="-top-10 -z-10 hidden md:block" edge="right" bleed={139} color="var(--color-gold-soft)" size={368} rotate={18} />
      <Splash className="top-[31%] -z-10 hidden md:block" edge="left" bleed={97} color="var(--color-sage)" size={256} rotate={-24} flip />
      <Splash className="top-[48%] -z-10 hidden md:block" edge="right" bleed={79} color="var(--color-gold)" size={208} rotate={40} />
      <Splash className="top-[63%] -z-10 hidden md:block" edge="left" bleed={115} color="var(--color-gold-soft)" size={304} rotate={-8} />
      <Splash className="bottom-[8rem] -z-10 hidden md:block" edge="right" bleed={91} color="var(--color-sage)" size={240} rotate={64} flip />

      {/* Out in the margins: the wide white borders either side of the
          column get their share of paint. The page clips horizontal
          overflow, so on narrow screens these bleed off the edge instead
          of causing a sideways scroll. */}
      <Splash className="top-[4%] -z-10 hidden md:block" edge="left" bleed={164} color="var(--color-sage)" size={432} rotate={12} />
      <Splash className="top-[16%] -z-10 hidden md:block" edge="left" bleed={98} color="var(--color-gold)" size={259} rotate={-40} flip />
      <Splash className="top-[34%] -z-10 hidden md:block" edge="left" bleed={212} color="var(--color-gold-soft)" size={560} rotate={30} />
      <Splash className="top-[52%] -z-10 hidden md:block" edge="left" bleed={76} color="var(--color-clay, #b3402f)" size={201} rotate={70} />
      <Splash className="top-[68%] -z-10 hidden md:block" edge="left" bleed={142} color="var(--color-gold)" size={374} rotate={-18} flip />
      <Splash className="top-[86%] -z-10 hidden md:block" edge="left" bleed={103} color="var(--color-sage)" size={273} rotate={48} />
      <Splash className="top-[9%] -z-10 hidden md:block" edge="right" bleed={131} color="var(--color-gold)" size={345} rotate={-25} flip />
      <Splash className="top-[26%] -z-10 hidden md:block" edge="right" bleed={185} color="var(--color-sage)" size={489} rotate={55} />
      <Splash className="top-[44%] -z-10 hidden md:block" edge="right" bleed={92} color="var(--color-gold-soft)" size={244} rotate={-60} />
      <Splash className="top-[60%] -z-10 hidden md:block" edge="right" bleed={120} color="var(--color-clay, #b3402f)" size={316} rotate={20} flip />
      <Splash className="top-[78%] -z-10 hidden md:block" edge="right" bleed={153} color="var(--color-gold-soft)" size={403} rotate={-35} />
      <Splash className="bottom-[2%] -z-10 hidden md:block" edge="right" bleed={109} color="var(--color-gold)" size={288} rotate={80} flip />

      {/* And a few in the middle of the page itself — behind the ink, so
          the words print over the paint like a letterpress. */}
      <Splash className="left-[16%] top-[13%] -z-10" color="var(--color-gold-soft)" size={230} rotate={-14} />
      <Splash className="right-[10%] top-[30%] -z-10" color="var(--color-sage)" size={180} rotate={35} flip />
      <Splash className="left-[28%] top-[46%] -z-10" color="var(--color-gold)" size={200} rotate={8} />
      <Splash className="right-[22%] top-[62%] -z-10" color="var(--color-clay, #b3402f)" size={150} rotate={-45} />
      <Splash className="left-[8%] top-[78%] -z-10" color="var(--color-sage)" size={190} rotate={60} flip />
      <Splash className="right-[14%] top-[92%] -z-10" color="var(--color-gold-soft)" size={210} rotate={-28} />

      {/* The same entrance the hero taught the reader: eyebrow breathes
          open, the headline rises line by line, the paragraph follows. */}
      <div className="eyebrow-in" style={{ animationDelay: '150ms' }}>
        <Eyebrow>{manifesto.eyebrow}</Eyebrow>
      </div>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        <span className="line-mask">
          <span style={{ animationDelay: '60ms' }}>Connecting generations.</span>
        </span>
        <span className="line-mask">
          <span style={{ animationDelay: '180ms' }}>Helping care homes.</span>
        </span>
      </h1>

      <p
        className="rise-in mt-6 text-lg leading-relaxed text-olive"
        style={{ animationDelay: '420ms' }}
      >
        {manifesto.body}
      </p>

      {/* Two photographs, slightly off-axis — people, not a stock collage. */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/auth-together.jpg"
          alt="A grandmother and her granddaughter laughing, cheek to cheek"
          className="aspect-[4/5] w-full -rotate-1 rounded-3xl object-cover shadow-[0_20px_45px_-28px_rgba(47,58,35,0.5)]"
          style={{ objectPosition: 'center 25%' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/homes/couple.jpg"
          alt="An older couple laughing together outside their house"
          className="mt-6 aspect-[4/5] w-full rotate-1 rounded-3xl object-cover shadow-[0_20px_45px_-28px_rgba(47,58,35,0.5)]"
          style={{ objectPosition: 'center 30%' }}
        />
      </div>

      {/* ------------------------------ the problem ------------------------------ */}
      <h2 className="mt-16 font-serif text-3xl font-medium text-forest">
        Two kinds of loneliness
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card-solid p-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sage">
            {bridge.left.label}
          </p>
          <p className="mt-2 font-serif text-xl font-medium leading-snug text-forest">
            {bridge.left.line}
          </p>
        </div>
        <div className="card-solid p-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sage">
            {bridge.right.label}
          </p>
          <p className="mt-2 font-serif text-xl font-medium leading-snug text-forest">
            {bridge.right.line}
          </p>
        </div>
      </div>
      <p className="mt-6 text-lg leading-relaxed text-olive">{bridge.join}</p>

      {/* ------------------------------ what we do ------------------------------ */}
      <h2 className="mt-16 font-serif text-3xl font-medium text-forest">
        What Brave Homes actually does
      </h2>
      <div className="mt-6 space-y-6 text-lg leading-relaxed text-olive">
        <p>
          <strong className="text-forest">A place to talk.</strong> Anyone can
          join, free, and speak with someone from another generation — by text,
          by voice note, by video call. Big buttons, simple words, nothing to
          install. Friendships here are the product; there is no other one.
        </p>
        <p>
          <strong className="text-forest">A hand for care homes.</strong> The
          donations go towards developing and improving care homes — the rooms,
          the equipment, and the days of the people who live in them. Every
          penny reaches the cause: our own costs are paid separately, never
          from a donation.
        </p>
      </div>

      <blockquote className="mt-12 border-l-4 border-gold pl-6">
        <p className="font-serif text-2xl font-medium italic leading-snug text-forest">
          {manifesto.quote}
        </p>
      </blockquote>

      {/* ------------------------------- values -------------------------------- */}
      <h2 className="mt-16 font-serif text-3xl font-medium text-forest">
        What we hold ourselves to
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <li key={v.label} className="card-solid p-6">
            <span className="font-serif text-xl font-medium text-forest">
              {v.label}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-olive">
              {VALUE_LINES[v.label]}
            </p>
          </li>
        ))}
      </ul>

      {/* ------------------------------ honesty note ---------------------------- */}
      <div className="card-solid mt-12 border-l-4 border-gold p-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-sage">
          Where we are today
        </p>
        <p className="mt-3 leading-relaxed text-olive">
          Brave Homes is young, and we would rather say so than pretend
          otherwise. The connecting part is alive right now — people are
          meeting on this site today. The giving part sends every penny
          towards care homes and the people in them. As we grow, this page
          will grow with real photos, real numbers and real names — nothing
          invented, ever.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <LinkButton href="/signup" size="lg">
          Join free
        </LinkButton>
        <LinkButton href="/portal/donate" variant="gold" size="lg">
          Donate
        </LinkButton>
      </div>

      {/* In front, faded — the "little overlap" that makes the page feel
          hand-made rather than templated. Low opacity keeps every word
          underneath fully readable. */}
      <Splash className="top-[17rem] opacity-50 hidden md:block" edge="left" bleed={98} color="var(--color-gold)" size={259} rotate={-15} />
      <Splash className="top-[54%] opacity-40 hidden md:block" edge="right" bleed={76} color="var(--color-clay, #b3402f)" size={201} rotate={30} />
    </div>
  );
}
