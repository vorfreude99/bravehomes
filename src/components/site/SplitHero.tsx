'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { LinkButton } from '@/components/ui/Button';
import { useReducedMotion } from '@/lib/hooks';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);


/** Figures for the merged panel. Every one of these is simply true —
    no invented member counts, no imaginary money. */
const PROOF = [
  { value: 'Free', label: 'to join, always' },
  { value: '3 ways', label: 'to talk — text · voice · video' },
  { value: '100%', label: 'of gifts to the cause' },
];

/** Maps `p` from the range [a, b] onto 0–1, clamped outside it. */
function range(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

/**
 * One small bird, flying left to right above a line of text as it
 * arrives — the letters seem to fall where it has just passed.
 *
 * Position is driven by `--lt`, the line's own 0–1 entrance progress
 * (set by the caller), so the flight is scroll-linked like the rest of
 * this hero: scroll back up and the bird retraces its path in reverse.
 * The wing flap is the one thing on a real clock — wings do not slow
 * down because the reader scrolled slowly.
 */
function LetterBird() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-3 -translate-y-full sm:-top-4"
      style={{
        opacity: 'calc(clamp(0, calc(var(--lt) * 6), 1) * clamp(0, calc((1 - var(--lt)) * 6), 1))',
        left: 'calc(var(--lt) * 100%)',
        transform: 'translate(-50%, -100%)',
      }}
    >
      <svg
        className="bird-flap"
        width="22"
        height="16"
        viewBox="0 0 32 22"
        fill="none"
      >
        <path
          d="M16 14 C 11 5 4 3 1 5 C 6 7 10 10 13 15 C 8 15 4 17 2 20 C 8 19 12 18 16 20 C 20 18 24 19 30 20 C 28 17 24 15 19 15 C 22 10 26 7 31 5 C 28 3 21 5 16 14Z"
          fill="var(--color-gold-deep)"
        />
      </svg>
    </span>
  );
}

/**
 * Splits a line into single-letter spans that drop in from above, each
 * one a beat after the last, riding the same `--lt` progress the bird
 * flies on — the cascade reads as the bird dropping them in flight.
 *
 * The real words still exist for anyone listening rather than looking:
 * a visually-hidden node carries the line whole, and the animated
 * letters are hidden from assistive tech so nothing is read out twice
 * or spelled letter by letter.
 */
function DroppedLine({ text }: { text: string }) {
  const chars = [...text];
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-block">
        <LetterBird />
        {chars.map((ch, j) => {
          const off = (j / chars.length) * 0.82;
          const wobble = ((j % 5) - 2) * 7;
          const t = `clamp(0, calc((var(--lt) - ${off.toFixed(3)}) * 6), 1)`;
          return (
            <span
              key={j}
              className="inline-block"
              style={{
                opacity: t,
                transform: `translate3d(0, calc((1 - ${t}) * -0.85em), 0) rotate(calc((1 - ${t}) * ${wobble}deg))`,
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          );
        })}
      </span>
    </>
  );
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
        //
        // The section itself is taller than these fractions alone need
        // (see the wrapper's h-[320svh]) specifically so that once the
        // payoff finishes revealing, there is a long flat stretch of
        // scroll left where nothing changes — time to actually read
        // "Connecting generations. Helping care homes." before the page
        // lets go and moves on, rather than snatching it away the moment
        // it lands.
        const close = range(p, 0, 0.482);
        const merged = range(p, 0.498, 0.669);

        pointerCurrent += (pointerTarget - pointerCurrent) * 0.06;

        set({
          '--gap': ((1 - close) * 21 + (1 - intro) * 13).toFixed(3),
          '--drift': ((1 - close) * 1.6).toFixed(3),
          '--close': close.toFixed(4),
          // Faint while far apart, brightest at the instant they touch,
          // then dissolving as the payoff takes over.
          '--seam': (Math.pow(close, 3) * (1 - merged)).toFixed(4),
          '--apart': (1 - range(p, 0.264, 0.451)).toFixed(4),
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
      className={`relative bg-cream ${still ? '' : 'h-[280svh]'}`}
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
                'translate3d(calc(var(--gap) * var(--bh-gap-k) * -1vw), calc(var(--drift) * 1vh), 0)',
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
                'translate3d(calc(var(--gap) * var(--bh-gap-k) * 1vw), calc(var(--drift) * -1vh), 0)',
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
            bright window behind them.
            Sized wide/tall enough to stay under the full text column at
            any viewport — at narrow (phone) widths the text's rem floor
            keeps it relatively large against the frame, so a tighter
            ellipse let its edges spill onto raw, unlit photograph: part
            of a line reading clean, the rest fighting the image behind
            it. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 88% 62% at 50% 47%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0) 82%)',
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
          // viewport and its top slides under the fixed bar — the
          // eyebrow disappears behind the header on any short screen
          // (79px of it at 360x640).
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
                className="eyebrow-in text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-sage-ink sm:text-xs"
                style={{ animationDelay: '350ms' }}
              >
                Connecting generations
              </p>

              {/* Sized in vw, like the band it sits in, so the longest
                  line stays inside the column at every viewport width. */}
              <h1
                // A handwritten face reads as a person having said this,
                // not a typesetter — the one line on the page that
                // should sound spoken. It needs real size to carry the
                // same weight a display serif does at half the height,
                // and loose, positive tracking: joined-up letterforms
                // collide under negative tracking the way type never does.
                className="mt-6 font-hand text-[clamp(3.4rem,7vw,8rem)] font-semibold leading-[0.92] tracking-[0.01em] text-forest [@media(max-height:700px)]:mt-3"
              >
                <span className="line-mask">
                  <span style={{ animationDelay: '60ms' }}>
                    {/* The line rises into place, then a nib of gold
                        sweeps across and writes it — two motions, one
                        gesture, the way a hand actually lifts a pen and
                        then sets it down to write. */}
                    <span className="ink-wipe" style={{ animationDelay: '410ms' }}>
                      Nobody should
                    </span>
                  </span>
                </span>
                <span className="line-mask">
                  <span style={{ animationDelay: '160ms' }}>
                    <span className="ink-wipe" style={{ animationDelay: '510ms' }}>
                      grow old
                    </span>
                  </span>
                </span>
                <span className="line-mask">
                  <span style={{ animationDelay: '260ms' }}>
                    <span className="ink-wipe" style={{ animationDelay: '610ms' }}>
                      <em className="brass-on-light own-line">
                        on their own.
                        {/* The underline draws itself, right to the full
                            stop — a hand finishing the sentence. */}
                        <svg
                          className="own-underline"
                          viewBox="0 0 320 24"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M8 16 Q 84 7 162 13 T 312 11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </em>
                    </span>
                  </span>
                </span>
              </h1>

              <p
                className="rise-in mx-auto mt-7 max-w-lg text-base leading-relaxed text-forest/80 sm:text-lg [@media(max-height:700px)]:mt-4"
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
                  className="group cta-sheen hover:-translate-y-0.5"
                >
                  Join free — takes a minute
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
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
                {['Connecting generations.', 'Helping care homes.', 'Changing lives.'].map(
                  (line, i) => (
                    <span
                      key={line}
                      className="relative block"
                      style={
                        still
                          ? undefined
                          : ({
                              '--lt': `clamp(0, calc((var(--merged) - ${i * 0.16}) * 4), 1)`,
                              // The brass line (i === 2) still needs its own
                              // fade/rise — DroppedLine supplies that for
                              // the other two, so only apply it here.
                              ...(i === 2
                                ? {
                                    opacity: `clamp(0, calc((var(--merged) - ${i * 0.16}) * 4), 1)`,
                                    transform: `translate3d(0, calc((1 - clamp(0, calc((var(--merged) - ${i * 0.16}) * 4), 1)) * 0.55em), 0)`,
                                  }
                                : {}),
                            } as React.CSSProperties)
                      }
                    >
                      {!still && i === 2 && <LetterBird />}
                      {i === 2 ? (
                        <em className="own-line brass-on-light brass-live not-italic">
                          {line}
                          {/* Act 1 underlined; Act 3 gets a different pen:
                              the reader's scroll circles the words, the way
                              a hand rings the line that matters. */}
                          <svg
                            className="pointer-events-none absolute -left-[7%] -top-[30%] h-[160%] w-[114%] overflow-visible text-gold-deep"
                            viewBox="0 0 340 130"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M212 14 C 96 2 18 26 16 62 C 14 100 96 122 178 120 C 268 118 326 96 324 60 C 322 30 268 10 196 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4.5"
                              strokeLinecap="round"
                              pathLength={100}
                              style={{
                                strokeDasharray: 100,
                                strokeDashoffset: still
                                  ? 0
                                  : 'calc((1 - clamp(0, calc((var(--merged) - 0.48) * 2.4), 1)) * 100)',
                                opacity: 0.85,
                              }}
                            />
                          </svg>
                          {/* Two pen flicks as the ring closes. */}
                          <span
                            className="absolute -right-6 -top-4 h-2 w-2 rotate-45 bg-gold max-sm:hidden"
                            aria-hidden="true"
                            style={
                              still
                                ? undefined
                                : {
                                    opacity: 'clamp(0, calc((var(--merged) - 0.66) * 6), 1)',
                                    transform:
                                      'rotate(45deg) scale(clamp(0, calc((var(--merged) - 0.66) * 6), 1))',
                                  }
                            }
                          />
                          <span
                            className="absolute -bottom-3 -left-7 h-1.5 w-1.5 rotate-45 bg-gold max-sm:hidden"
                            aria-hidden="true"
                            style={
                              still
                                ? undefined
                                : {
                                    opacity: 'clamp(0, calc((var(--merged) - 0.7) * 6), 1)',
                                    transform:
                                      'rotate(45deg) scale(clamp(0, calc((var(--merged) - 0.7) * 6), 1))',
                                  }
                            }
                          />
                        </em>
                      ) : still ? (
                        line
                      ) : (
                        <DroppedLine text={line} />
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
                className="mx-auto mt-8 flex items-center justify-center gap-3 [@media(max-height:860px)]:mt-5"
                style={
                  still
                    ? undefined
                    : {
                        opacity: 'clamp(0, calc((var(--merged) - 0.44) * 5), 1)',
                        transform:
                          'scaleX(clamp(0.4, calc(0.4 + (var(--merged) - 0.44) * 3), 1))',
                      }
                }
                aria-hidden="true"
              >
                <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/70" />
                <span
                  className="h-2 w-2 shrink-0 border border-gold/80"
                  style={
                    still
                      ? { transform: 'rotate(45deg)' }
                      : {
                          transform:
                            'rotate(calc(45deg + (1 - clamp(0, calc((var(--merged) - 0.44) * 3), 1)) * 180deg))',
                        }
                  }
                />
                <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/70" />
              </span>

              <p
                className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-olive sm:text-lg [@media(max-height:860px)]:mt-4 [@media(max-height:860px)]:text-sm [@media(max-height:860px)]:sm:text-base"
                style={
                  still
                    ? undefined
                    : {
                        opacity: 'clamp(0, calc((var(--merged) - 0.5) * 4), 1)',
                        transform:
                          'translate3d(0, calc((1 - clamp(0, calc((var(--merged) - 0.5) * 4), 1)) * 18px), 0)',
                      }
                }
              >
                Somebody your grandmother’s age is waiting for a conversation,
                and somebody your age is the reason she’ll get one. Free to join,
                and every penny of every donation goes straight to the cause.
              </p>

              {/* The figures answer the question the picture provokes: is
                  any of this real? */}
              <dl
                className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-4 divide-sage/30 sm:flex-row sm:gap-0 sm:divide-x [@media(max-height:860px)]:mt-5"
                style={
                  still
                    ? undefined
                    : {
                        opacity: 'clamp(0, calc((var(--merged) - 0.56) * 4), 1)',
                        transform:
                          'translate3d(0, calc((1 - clamp(0, calc((var(--merged) - 0.56) * 4), 1)) * 16px), 0)',
                      }
                }
              >
                {PROOF.map((stat, i) => (
                  <div
                    key={stat.label}
                    className="px-5 text-center sm:px-7"
                    style={
                      still
                        ? undefined
                        : {
                            opacity: `clamp(0, calc((var(--merged) - ${0.56 + i * 0.05}) * 4), 1)`,
                            transform: `translate3d(0, calc((1 - clamp(0, calc((var(--merged) - ${0.56 + i * 0.05}) * 4), 1)) * 12px), 0)`,
                          }
                    }
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="brass-on-light block font-serif text-3xl font-medium sm:text-4xl">
                        {stat.value}
                      </span>
                      <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-olive sm:text-xs">
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
                    : {
                        opacity: 'clamp(0, calc((var(--merged) - 0.62) * 4), 1)',
                        transform:
                          'translate3d(0, calc((1 - clamp(0, calc((var(--merged) - 0.62) * 4), 1)) * 14px), 0)',
                      }
                }
              >
                {/* The opening screen already asked them to join. By this
                    point they have read the promise and the stats — ask
                    the second question instead of the same one twice. */}
                <LinkButton
                  href="/portal/donate"
                  variant="gold"
                  size="lg"
                  className="group cta-sheen hover:-translate-y-0.5"
                >
                  Donate — 100% to the cause
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
