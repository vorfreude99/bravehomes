'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Flag } from '@/components/ui/Flag';
import { BUILD_STAGES, currency, type Project } from '@/lib/content';

type Photo = { src: string; position: string };

/**
 * Fitting the carousel to a pinned screen by shrinking the cards was a
 * feedback loop — the card width set the text height, the text height
 * set the card width, and React gave up with "maximum update depth
 * exceeded". A transform does not affect layout, so scaling to fit
 * measures once and settles.
 */
const MIN_SCALE = 0.5;

/**
 * A 3D carousel of the builds.
 *
 * Coverflow rather than a ring: with only three homes, a true cylinder
 * puts the neighbours at 120° — edge-on and unreadable. Here the
 * neighbours stay side-on but legible, and the whole thing still reads
 * as depth because each card is pushed back in Z as well as rotated.
 *
 * Everything is one transform per card, so the browser animates it on
 * the compositor; no layout is touched while it turns.
 */
export function HomesCarousel({
  projects,
  photos,
  driver,
  boundHeight = 0,
}: {
  projects: Project[];
  photos: Photo[];
  /**
   * The pinned section. Progress through it — not the carousel's own
   * position — decides which build is showing, so the page cannot move
   * on until all of them have been seen.
   */
  driver?: React.RefObject<HTMLElement | null>;
  /** Space the carousel has to fit into, so it can size its cards. */
  boundHeight?: number;
}) {
  const count = projects.length;
  const [active, setActive] = useState(0);
  const [card, setCard] = useState(540);
  const [frameHeight, setFrameHeight] = useState(0);
  /** Natural height of frame + controls, before any fitting. */
  const [natural, setNatural] = useState(0);
  const [narrow, setNarrow] = useState(false);

  const frame = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);

  /* The card scales with the space available, and every offset below is
     derived from it — so the arrangement holds at any width. */
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCard(Math.min(540, Math.max(260, w * 0.8)));
      // A narrow screen cannot afford the full spread — the neighbours
      // end up off-canvas entirely — and a steep angle on a small card
      // just smears the photograph.
      setNarrow(w < 700);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The cards are absolutely positioned, so the frame has no height of
     its own. It used to be a guessed multiple of the card width, which
     left a band of empty space under the carousel; measuring the tallest
     card means the frame is exactly as deep as its contents. */
  useLayoutEffect(() => {
    const measure = () => {
      const tallest = cards.current.reduce(
        (max, el) => (el ? Math.max(max, el.offsetHeight) : max),
        0,
      );
      if (tallest) setFrameHeight(tallest);
    };
    measure();
    const ro = new ResizeObserver(measure);
    cards.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [card]);

  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setNatural(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [card, frameHeight]);

  const scale =
    boundHeight && natural > boundHeight
      ? Math.max(MIN_SCALE, boundHeight / natural)
      : 1;

  const go = useCallback(
    (dir: number) => setActive((a) => (a + dir + count) % count),
    [count],
  );

  /* --------------------------- drag / swipe ---------------------------
     No `setPointerCapture` here. Capturing on pointerdown retargets the
     click to the frame, so the cards' own click handlers never fired and
     tapping a neighbour did nothing. Tracking the distance by hand keeps
     the swipe and leaves the click alone. */
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    // Past the threshold it was a swipe, and the click that follows is
    // suppressed so the card underneath does not also get selected.
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
      window.setTimeout(() => (swiped.current = false), 0);
    }
  };

  /**
   * Scrolling past the section walks through the builds, so every card
   * is seen without anyone having to press anything.
   *
   * It only calls `setActive` when *its own* computed index changes, not
   * whenever it disagrees with `active` — otherwise the next frame would
   * yank the carousel back the moment you pressed a control.
   */
  const fromScroll = useRef(-1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;

    let raf = 0;
    let running = false;

    const tick = () => {
      const vh = window.innerHeight;
      const host = driver?.current;
      let p: number;

      if (host) {
        // Pinned: 0 when the section sticks, 1 when it lets go.
        const r = host.getBoundingClientRect();
        const travel = r.height - vh;
        p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
      } else {
        const rect = el.getBoundingClientRect();
        p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      }

      // Equal share of the travel each, so every card gets its own turn
      // rather than the middle one owning half the section.
      const idx = Math.min(count - 1, Math.floor(p * count * 0.999));
      if (idx !== fromScroll.current) {
        fromScroll.current = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [count, driver]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    const el = frame.current;
    el?.addEventListener('keydown', onKey);
    return () => el?.removeEventListener('keydown', onKey);
  }, [go]);

  /** Shortest way round, so the ends wrap instead of racing back. */
  const offsetOf = (i: number) => {
    let o = i - active;
    if (o > count / 2) o -= count;
    if (o < -count / 2) o += count;
    return o;
  };

  return (
    <div
      className="flex h-full flex-col justify-start overflow-hidden"
      style={{ height: boundHeight || undefined }}
    >
      <div
        ref={inner}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
      >
      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="The homes being built"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        className="relative touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        style={{ perspective: '1600px', height: frameHeight || undefined }}
      >
        {projects.map((project, i) => {
          const offset = offsetOf(i);
          const away = Math.abs(offset);
          const on = offset === 0;
          const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));
          const photo = photos[i % photos.length];

          return (
            <article
              key={project.id}
              className="absolute left-1/2 top-0 origin-center transition-all duration-500"
              style={{
                width: card,
                zIndex: 10 - away,
                opacity: away > 1 ? 0 : on ? 1 : 0.55,
                transform: `translateX(-50%) translateX(${
                  offset * card * (narrow ? 0.58 : 0.86)
                }px) translateZ(${-away * (narrow ? 150 : 240)}px) rotateY(${
                  offset * (narrow ? -26 : -38)
                }deg) scale(${1 - away * 0.05})`,
                transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {!on && (
                <button
                  type="button"
                  onClick={() => {
                    if (swiped.current) return;
                    setActive(i);
                  }}
                  aria-label={`Show ${project.name}`}
                  className="absolute inset-0 z-10 cursor-pointer rounded-[var(--bh-radius)] outline-none ring-gold/70 focus-visible:ring-2"
                />
              )}

              <div
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className={`overflow-hidden rounded-[var(--bh-radius)] bg-white ring-1 transition-shadow duration-700 ${
                  on
                    ? 'shadow-[0_40px_70px_-30px_rgba(47,58,35,0.45)] ring-gold/50'
                    : 'shadow-[0_20px_40px_-28px_rgba(47,58,35,0.35)] ring-forest/10'
                }`}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="540px"
                    className="object-cover"
                    style={{ objectPosition: photo.position }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(18,24,14,0.9) 0%, rgba(18,24,14,0) 55%)',
                    }}
                  />
                </div>

                <div className="px-6 pb-7 pt-5">
                  <h3 className="font-serif text-2xl font-medium leading-tight text-forest">
                    {project.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-2.5 text-sm text-olive">
                    <Flag region={project.region} size={16} />
                    {project.status}
                  </p>

                  {/* The stage the build has reached. Spelling out all six
                      labels wrapped to three lines in a card this wide, so
                      the run of stages is a segmented bar and only the
                      current one is named. */}
                  <div className="mt-6">
                    <div className="flex gap-1" aria-hidden="true">
                      {BUILD_STAGES.map((label, si) => (
                        <span
                          key={label}
                          className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                            si < project.stage
                              ? 'bg-gold-soft'
                              : si === project.stage
                                ? 'bg-gold'
                                : 'bg-forest/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-gold-ink">
                      {BUILD_STAGES[project.stage]}
                      <span className="ml-2 font-semibold text-ink-muted">
                        stage {project.stage + 1} of {BUILD_STAGES.length}
                      </span>
                    </p>
                  </div>

                  <div className="mt-6 flex items-baseline justify-between gap-4">
                    <p className="font-serif text-2xl font-medium leading-none text-gold-deep">
                      {currency.format(project.raised)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      of {currency.format(project.goal)}
                    </p>
                  </div>

                  <div
                    className="mt-4 h-px w-full bg-forest/12"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} funding progress`}
                  >
                    <div
                      className="h-px bg-gold transition-[width] duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Position indicator. The prev/next arrows are gone — scrolling
          the pinned section is what moves the carousel now, so a pair of
          buttons doing the same job was a second control for one job. */}
      <div className="relative z-20 mt-5 flex shrink-0 items-center justify-center">
        <div className="flex items-center gap-1">
          {projects.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              // The bar is 6px tall; the button around it must not be, or
              // there is nothing to hit on a phone. The label differs
              // from the card's so screen readers do not announce two
              // controls with the same name.
              aria-label={`Go to ${p.name}`}
              aria-current={i === active ? 'true' : undefined}
              className="group flex h-11 items-center px-2.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? 'w-8 bg-gold' : 'w-1.5 bg-sage/50 group-hover:bg-sage'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Screen readers get the change announced; the transform means
          nothing to them. */}
      </div>

      <p className="sr-only" aria-live="polite">
        {projects[active].name} — {BUILD_STAGES[projects[active].stage]},{' '}
        {currency.format(projects[active].raised)} of{' '}
        {currency.format(projects[active].goal)} raised
      </p>
    </div>
  );
}

