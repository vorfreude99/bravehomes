'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { LinkButton } from '@/components/ui/Button';
import { useReducedMotion } from '@/lib/hooks';
import { currency, projects } from '@/lib/content';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);

/** Figures for the merged panel. All from the brief — nothing invented. */
const PROOF = [
  { value: '247', label: 'people online now' },
  { value: currency.format(totalRaised), label: 'raised so far' },
  { value: '100%', label: 'goes to the cause' },
];

/** Maps `p` from the range [a, b] onto 0–1, clamped outside it. */
function range(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

/** The state everything is derived from, at rest before the intro runs. */
const INITIAL_VARS = {
  '--gap': '34',
  '--drift': '1.6',
  '--close': '0',
  '--seam': '0',
  '--apart': '1',   // the headline, while the halves are apart
  '--merged': '0',  // the payoff, once they are one picture
  '--px': '0',
} as React.CSSProperties;

/** Where the choreography ends up — used for reduced motion. */
const FINISHED_VARS: Record<string, string> = {
  '--gap': '0',
  '--drift': '0',
  '--close': '1',
  '--seam': '0',
  '--apart': '1',
  '--merged': '1',
  '--px': '0',
};

/**
 * The hero.
 *
 * The photograph is cut down the middle and pulled apart: the woman on
 * one side, the man on the other, a band of darkness between them. As
 * the page scrolls the two halves slide back together and the picture
 * becomes whole — the headline hands over to the line about being the
 * bridge between them.
 *
 * Both halves render the *same* image at double panel width, one
 * anchored left and one anchored right, so at gap zero they reconstruct
 * the original frame seamlessly.
 *
 * Every scroll-driven value is written to a CSS custom property on the
 * stage and consumed by `calc()` in the styles below. Nothing here calls
 * setState while scrolling: driving this through React re-rendered the
 * whole tree on every frame, which was the single biggest source of
 * dropped frames in the hero.
 */
export function SplitHero() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /**
   * The server can't know the user's motion preference, so branching the
   * markup on it during the first render produces a hydration mismatch —
   * and React does not patch up mismatched attributes. Gate the static
   * layout behind mount so both renders agree, then switch.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const still = mounted && reduced;

  useEffect(() => {
    const set = (vars: Record<string, string>) => {
      const el = stage.current;
      if (!el) return;
      for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    };

    // Reduced motion gets the finished state: one whole photograph, no
    // scroll choreography, nothing that moves under the reader.
    if (reduced) {
      set(FINISHED_VARS);
      return;
    }

    let raf = 0;
    let running = false;
    const started = performance.now();
    let pointerTarget = 0;
    let pointerCurrent = 0;

    const onMove = (e: PointerEvent) => {
      pointerTarget = (e.clientX / window.innerWidth) * 2 - 1;
    };

    const frame = (now: number) => {
      const section = wrap.current;
      if (section) {
        const total = section.offsetHeight - window.innerHeight;
        const scrolled = -section.getBoundingClientRect().top;
        const p = total > 0 ? clamp01(scrolled / total) : 0;

        // Opening move: the halves arrive from further out and settle.
        const t = Math.min(1, (now - started) / 1200);
        const intro = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        // The halves close over the first two thirds; the words cross
        // over after that, once the picture is already whole. The merged
        // photograph gets its own line — repeating the headline there
        // would waste the one moment the mechanic has been building to.
        const close = range(p, 0, 0.62);
        const merged = range(p, 0.64, 0.86);

        pointerCurrent += (pointerTarget - pointerCurrent) * 0.06;

        set({
          '--gap': ((1 - close) * 21 + (1 - intro) * 13).toFixed(3),
          '--drift': ((1 - close) * 1.6).toFixed(3),
          '--close': close.toFixed(4),
          // Faint while far apart, brightest at the instant they touch,
          // then dissolving as the payoff takes over.
          '--seam': (Math.pow(close, 3) * (1 - merged)).toFixed(4),
          '--apart': (1 - range(p, 0.34, 0.58)).toFixed(4),
          '--merged': merged.toFixed(4),
          '--px': pointerCurrent.toFixed(4),
        });
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // No point animating a hero nobody is looking at.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    if (wrap.current) io.observe(wrap.current);

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io.disconnect();
      stop();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return (
    <section
      ref={wrap}
      className={`relative bg-cream ${still ? '' : 'h-[240svh]'}`}
    >
      <div
        ref={stage}
        style={INITIAL_VARS}
        className={`overflow-hidden ${
          still ? 'relative min-h-[100svh]' : 'sticky top-0 h-[100svh]'
        }`}
      >
        {/* The ground the band is cut out of. Only visible between the
            halves, so this is what the gap actually looks like: a graded,
            grained surface rather than one flat fill. */}
        <div
          className="grain absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, #ffffff 0%, #fbfbf9 48%, #f4f4f1 100%)',
          }}
          aria-hidden="true"
        />

        {/* ------------------------------ The halves -----------------------------
            Inset negatively so the pointer parallax always has bleed to
            move into — without it, shifting the pair sideways exposes a
            bare strip at one edge of the screen. Both halves move by the
            same amount, which keeps the join seamless. */}
        <div
          className="absolute inset-y-0 -left-4 -right-4 flex"
          style={{ transform: 'translate3d(calc(var(--px) * 10px), 0, 0)' }}
        >
          {/* No scale() on the image wrappers. A continuously-updated
              transform: scale() on a promoted layer makes Chrome rasterise
              the texture once and stretch it on the GPU, which softened
              the photograph on top of the resampling. */}
          <div
            className="relative h-full w-1/2 overflow-hidden will-change-transform"
            style={{
              transform:
                'translate3d(calc(var(--gap) * -1vw), calc(var(--drift) * 1vh), 0)',
            }}
          >
            <div className="absolute inset-y-0 left-0 w-[200%]">
              <Image
                src="/hero-2048.jpg"
                alt="An older woman sitting with a young man, sharing a tablet between them."
                fill
                priority
                quality={90}
                sizes="100vw"
                className="object-cover"
              />
            </div>
            {/* Light falling away into the gap, so the cut reads as depth
                rather than a flat edge. Fades out as the halves close, or
                the mended photograph would keep a dark seam down it. */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-[16%] bg-gradient-to-r from-transparent to-cream"
              style={{ opacity: 'calc(1 - var(--close))' }}
              aria-hidden="true"
            />
          </div>

          <div
            className="relative h-full w-1/2 overflow-hidden will-change-transform"
            style={{
              transform:
                'translate3d(calc(var(--gap) * 1vw), calc(var(--drift) * -1vh), 0)',
            }}
          >
            <div className="absolute inset-y-0 right-0 w-[200%]">
              {/* Decorative: the left half already carries the description. */}
              <Image
                src="/hero-2048.jpg"
                alt=""
                fill
                priority
                quality={90}
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-[16%] bg-gradient-to-l from-transparent to-cream"
              style={{ opacity: 'calc(1 - var(--close))' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Darkens as the halves close, so the quote has ground to sit on.
            Alpha is interpolated inside the colour, so this whole gradient
            updates from the same variables without a re-render. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgb(255 255 255 / calc(0.48 + var(--close) * 0.1)) 0%, rgb(255 255 255 / calc(0.06 + var(--merged) * 0.2)) 46%, rgb(255 255 255 / calc(0.62 + var(--close) * 0.18)) 100%)',
          }}
          aria-hidden="true"
        />

        {/* A pool of shade under the words specifically. The full-frame
            gradient has to stay light in the middle so the photograph
            reads, which left the eyebrow and sub-line sitting on the
            bright window behind them. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 62% 46% at 50% 47%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.5) 52%, rgba(255,255,255,0) 76%)',
          }}
          aria-hidden="true"
        />

        {/* The seam: a soft column of light, then a hard filament, sitting
            exactly where the two halves come together. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[26vw] -translate-x-1/2"
          style={{
            opacity: 'calc(var(--seam) * 0.85)',
            background:
              'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(201,154,63,0.22) 0%, rgba(201,154,63,0) 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{
            opacity: 'var(--seam)',
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(169,124,39,0.55) 25%, rgba(201,154,63,0.9) 50%, rgba(169,124,39,0.55) 75%, transparent 100%)',
            boxShadow:
              '0 0 calc(14px + var(--seam) * 20px) calc(3px + var(--seam) * 6px) rgb(201 154 63 / calc(0.28 * var(--seam)))',
          }}
          aria-hidden="true"
        />

        {/* ------------------------------- The words ----------------------------- */}
        <div
          className={
            still
              ? 'relative flex min-h-[100svh] flex-col items-center justify-center gap-16 px-5 pb-28 sm:px-8'
              : 'absolute inset-0 flex items-center justify-center px-5 sm:px-8'
          }
          // Centre within the space *below* the header, not the whole
          // stage. Without this the block is centred against the full
          // viewport and its top slides under the fixed bar — invisible
          // at the default text size, but Easy View grows the block ~20%
          // and the eyebrow disappears behind the header on any short
          // screen (79px of it at 360x640).
          style={{ paddingTop: `calc(var(--bh-header) + ${still ? '2rem' : '1.75rem'})` }}
        >
          {/* Matches the band (2 × 21vw) on wide screens; on a phone the
              band is far too narrow to hold text, so the block simply
              uses the available width there. */}
          <div className="w-full max-w-2xl text-center lg:max-w-[41vw]">
            <div
              style={{
                opacity: 'var(--apart)',
                transform: 'translate3d(0, calc((1 - var(--apart)) * -26px), 0)',
              }}
            >
              {/* Eyebrow. Previously flanked by two hairlines with 0.34em
                  tracking — the centred-label-between-rules is one of the
                  most recognisable template patterns going. A quieter
                  label lets the headline do the work. */}
              <p
                className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-sage-ink sm:text-xs"
              >
                Connecting generations
              </p>

              {/* Sized in vw, like the band it sits in, so the longest
                  line stays inside the column at every viewport width. */}
              <h1
                // A high-contrast serif at display size wants a touch of
                // positive tracking, not negative: tightening it collides
                // the thin strokes and muddies the counters.
                className="mt-6 font-serif text-[clamp(2.6rem,5vw,6rem)] font-medium leading-[0.98] tracking-[-0.018em] text-forest [@media(max-height:700px)]:mt-3"
              >
                <span className="line-mask">
                  <span style={{ animationDelay: '60ms' }}>Nobody should</span>
                </span>
                <span className="line-mask">
                  <span style={{ animationDelay: '160ms' }}>grow old</span>
                </span>
                <span className="line-mask">
                  <span style={{ animationDelay: '260ms' }}>
                    <em className="brass-on-light">on their own.</em>
                  </span>
                </span>
              </h1>

              <p
                className="rise-in mx-auto mt-7 max-w-lg text-base leading-relaxed text-olive sm:text-lg [@media(max-height:700px)]:mt-4"
                style={{ animationDelay: '620ms' }}
              >
                Real friendships between real people — and the homes that give
                them somewhere to belong.
              </p>

              <div
                className="rise-in mt-9 flex flex-wrap justify-center gap-3 [@media(max-height:700px)]:mt-5"
                style={{ animationDelay: '740ms' }}
              >
                <LinkButton
                  href="/signup"
                  variant="gold"
                  size="lg"
                  className="group hover:-translate-y-0.5"
                >
                  Join free — takes a minute
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </LinkButton>
                <LinkButton
                  href="/portal/donate"
                  variant="secondary"
                  size="lg"
                  className="hover:-translate-y-0.5"
                >
                  Donate
                </LinkButton>
              </div>
            </div>
          </div>

          {/* The payoff, on the mended photograph.

              A sibling of the headline column, not a child of it: by the
              time this appears the halves have closed and the whole frame
              is free, so it is not boxed into the 21vw band the headline
              needed.

              Deliberately NOT the headline again — the merge is the one
              moment the whole mechanic has been building to, and repeating
              the line there would throw it away. These are the brand's own
              three statements, arriving one at a time as the two pictures
              become one picture. */}
          <div
            className={
              still
                ? 'w-full'
                : 'pointer-events-none absolute inset-x-0 px-5 sm:px-8'
            }
            style={
              still
                ? undefined
                : {
                    // Half the header height, so the block centres in the
                    // space below the fixed bar rather than on the stage
                    // midpoint. Act 1 had the same fault; this block is
                    // much taller, so it showed up far more.
                    top: 'calc(50% + var(--bh-header) / 2)',
                    opacity: 'var(--merged)',
                    transform:
                      'translate3d(0, calc(-50% + (1 - var(--merged)) * 24px), 0)',
                  }
            }
          >
            <div className="mx-auto max-w-4xl text-center">
              {/* No eyebrow here. It read "CONNECTING GENERATIONS" directly
                  above a line beginning "Connecting generations." — the
                  same words twice in the same breath. */}
              <p className="font-serif text-[clamp(2rem,4.2vw,4.2rem)] font-medium leading-[1.06] tracking-[-0.02em] text-forest [@media(max-height:860px)]:text-[clamp(1.6rem,3.4vw,2.8rem)]">
                {['Connecting generations.', 'Building homes.', 'Changing lives.'].map(
                  (line, i) => (
                    <span
                      key={line}
                      className="block"
                      style={
                        still
                          ? undefined
                          : {
                              // Each line lands a beat after the one before.
                              opacity: `clamp(0, calc((var(--merged) - ${i * 0.16}) * 4), 1)`,
                            }
                      }
                    >
                      {i === 2 ? (
                        <em className="brass-on-light not-italic">{line}</em>
                      ) : (
                        line
                      )}
                    </span>
                  ),
                )}
              </p>

              {/* The merged photograph is the emotional peak of the page,
                  and until now it had nothing to act on: the headline's
                  buttons fade out with the first act. Both facts below are
                  from the brief, and neither is repeated anywhere else in
                  the hero. */}
              {/* A short rule to close the statement and open the detail —
                  without it the prose ran straight on from the display type
                  and the block read as one undifferentiated column. */}
              <span
                className="mx-auto mt-8 block h-px w-16 bg-gold/50 [@media(max-height:860px)]:mt-5"
                style={
                  still
                    ? undefined
                    : {
                        transform:
                          'scaleX(clamp(0, calc((var(--merged) - 0.44) * 5), 1))',
                      }
                }
                aria-hidden="true"
              />

              <p
                className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-olive sm:text-lg [@media(max-height:860px)]:mt-4 [@media(max-height:860px)]:text-sm [@media(max-height:860px)]:sm:text-base"
                style={
                  still
                    ? undefined
                    : { opacity: 'clamp(0, calc((var(--merged) - 0.5) * 4), 1)' }
                }
              >
                Somebody your grandmother’s age is waiting for a conversation,
                and somebody your age is the reason she’ll get one. Free to join,
                and every penny of every donation goes straight to the cause —
                not one penny to admin.
              </p>

              {/* The figures answer the question the picture provokes: is
                  any of this real? */}
              <dl
                className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center divide-x divide-sage/30 [@media(max-height:860px)]:mt-5"
                style={
                  still
                    ? undefined
                    : { opacity: 'clamp(0, calc((var(--merged) - 0.56) * 4), 1)' }
                }
              >
                {PROOF.map((stat) => (
                  <div key={stat.label} className="px-5 text-center sm:px-7">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block font-serif text-2xl font-medium text-forest sm:text-3xl">
                        {stat.value}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted sm:text-sm">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <div
                className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3 [@media(max-height:860px)]:mt-5"
                style={
                  still
                    ? undefined
                    : { opacity: 'clamp(0, calc((var(--merged) - 0.62) * 4), 1)' }
                }
              >
                <LinkButton
                  href="/signup"
                  variant="gold"
                  size="lg"
                  className="group hover:-translate-y-0.5"
                >
                  Join free
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </LinkButton>
                <LinkButton
                  href="#homes"
                  variant="secondary"
                  size="lg"
                  className="hover:-translate-y-0.5"
                >
                  See the homes
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
