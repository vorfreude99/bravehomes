'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PhoneMock } from './PhoneMock';
import { Eyebrow } from '@/components/ui/Button';
import { steps } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';

/** Reads the live header height for the observer, which needs a number. */
function headerHeight() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--bh-header');
  return parseFloat(raw) || 72;
}

/**
 * One section: the heading and the phone both stay put while the four
 * steps travel past them.
 *
 * Each step lights up as it reaches the middle of the viewport, and the
 * phone switches to that step's screen — so it reads as one continuous
 * demonstration rather than four cards in a grid.
 *
 * The masthead is sticky rather than the whole section being pinned.
 * Pinning only worked on viewports over ~860px tall; below that it fell
 * back to ordinary scrolling and "How Brave Homes works" slid away while
 * you were still reading the steps. Sticking the heading keeps it on
 * screen at every height, and the phone stays at full size — no shrinking
 * the layout to make it fit a screenful.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const wrap = useRef<HTMLElement>(null);
  const [railHeight, setRailHeight] = useState(0);

  /**
   * The masthead collapses once you are inside the section.
   *
   * At full size it costs ~110px of every screen, and on a 720px viewport
   * that left less room than the phone needs — so either the title slid
   * away or the phone did. Collapsed it costs ~46px, which is enough for
   * a full-size phone to stick beneath it even on a short laptop.
   */
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  /**
   * The masthead is pushed off by the last step rather than staying put
   * to the very end of the section.
   *
   * Written as a CSS variable from the same rAF loop that picks the
   * active step: once the final step rises far enough to meet the
   * masthead, `top` goes negative at exactly scroll speed, so the title
   * travels up with the content instead of hanging over the donation
   * step it has nothing left to say about.
   */
  const masthead = useRef<HTMLDivElement>(null);

  /**
   * Whichever step is nearest the middle of the screen is the active one.
   *
   * This used to be an IntersectionObserver with a narrow band, taking
   * whichever entry came last in the callback. With the steps close
   * together two of them sat in the band at once and the later one won —
   * so scrolling to step 2 lit step 3 and the counter skipped a number.
   * Measuring distance to the centre can't tie.
   */
  useEffect(() => {
    const section = wrap.current;
    if (!section) return;

    let raf = 0;
    let running = false;
    let current = -1;

    const frame = () => {
      const nodes = items.current.filter(Boolean) as HTMLLIElement[];

      const head = masthead.current;
      const last = nodes[nodes.length - 1];
      if (head && last) {
        const base = headerHeight() + 8;

        // The release starts as the final step enters the lower part of
        // the screen, then tracks scroll one-for-one with no ceiling.
        //
        // It used to stop at the masthead's own height, which looked
        // right until you kept scrolling: the title was not travelling
        // away, it was pinned at a fixed negative offset just off the
        // top, and stayed stuck there for the rest of the section. Any
        // device whose header measured taller than that offset showed it
        // hanging on. Unbounded, it leaves for good — and coming back up
        // the same sum re-sticks it exactly where it was.
        const start = window.innerHeight * 0.7;
        const push = Math.max(0, start - last.getBoundingClientRect().top);
        section.style.setProperty('--how-top', `${Math.round(base - push)}px`);
      }

      if (nodes.length) {
        const middle = window.innerHeight / 2;
        let best = 0;
        let bestDistance = Infinity;

        nodes.forEach((node, i) => {
          const rect = node.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - middle);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });

        if (best !== current) {
          current = best;
          setActive(best);
        }
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

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(section);

    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${headerHeight() + 16}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const measure = useCallback(() => {
    const node = items.current[active];
    if (node && list.current) setRailHeight(node.offsetTop + 32);
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <section id="how" ref={wrap} className="relative bg-cream px-5 pb-8 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      {/* No `overflow-hidden` on any ancestor of the sticky elements: an
          overflow ancestor becomes the scroll container and silently stops
          them sticking at all. */}
      <div className="mx-auto max-w-7xl">
        {/* Marks the point at which the masthead becomes stuck. */}
        <div ref={sentinel} aria-hidden="true" className="h-px w-full" />

        {/* Masthead. Sticks below the site header and stays there for the
            whole section, so the steps scroll beneath it rather than the
            title disappearing off the top. */}
        <div
          ref={masthead}
          className={`z-10 bg-cream transition-[padding] duration-300 max-lg:static lg:sticky ${
            stuck ? 'pb-3 pt-1' : 'pb-6'
          }`}
          style={{ top: 'var(--how-top, calc(var(--bh-header) + 0.5rem))' }}
        >
          <div className="max-w-3xl">
            <div
              className={`reveal overflow-hidden transition-all duration-300 ${
                stuck ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'
              }`}
            >
              <Eyebrow>SIMPLE BY DESIGN</Eyebrow>
            </div>

            <h2
              // One size throughout. Scaling it down on stick made the
              // title visibly shrink as you scrolled; the eyebrow and the
              // padding collapsing already reclaim the height.
              className={`font-serif text-3xl font-medium leading-[1.05] text-forest transition-all duration-300 sm:text-[2.5rem] ${
                stuck ? 'mt-0' : 'mt-3'
              }`}
            >
              <span className="line-mask">
                <span style={{ animationDelay: '40ms' }}>
                  How Brave Homes <em className="not-italic text-sage">works</em>
                </span>
              </span>
            </h2>
          </div>
        </div>

        <p className="reveal mt-2 max-w-2xl text-lg leading-relaxed text-olive" data-delay="120">
          Designed for everyone — whether you’re 18 or 88. Big buttons, simple
          symbols. Text, voice, or video. Whatever feels comfortable.
        </p>

        {/* The shared, live-updating phone only works side-by-side: its
            sticky-while-you-scroll trick depends on sitting in its own
            column next to the (much taller) steps column, so the two never
            physically overlap even while sharing the same vertical scroll
            region. Below `lg` there's no second column to keep them apart,
            so this whole column is hidden there — each step below carries
            its own paired screen instead, right next to its own text
            rather than shared and animated from afar. The `<ol>` itself
            stays a single instance at every width (not duplicated per
            breakpoint): it's what the active-step scroll tracking above
            measures via `items.current`, and a second copy would fight
            the first over those refs. */}
        <div className="mt-14 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          {/* Full size, always. The phone is the demonstration — shrinking
              it to fit a layout defeats the point of having it. */}
          <div
            className="sticky hidden self-start lg:block"
            style={{ top: 'calc(var(--bh-header) + 4.1rem)' }}
          >
            <PhoneMock className="mx-auto" step={active} />

            <div className="mt-6 flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === active ? 'w-8 bg-gold' : 'w-1.5 bg-sage/40'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Trailing space so the last step can still reach the middle of
              the viewport — without it the fourth never activates and the
              shared phone never shows its screen. Desktop-only: below
              `lg` each step already carries its own phone (see below),
              so nothing depends on step 4 reaching true centre there —
              it was just ~185px of dead air closing out the section. */}
          <ol ref={list} className="relative pb-6 lg:pb-[22vh]">
            {/* The rail, and the gold that fills it as you descend. */}
            <span
              className="absolute left-[1.65rem] top-3 bottom-3 w-px bg-sage/25 sm:left-[1.9rem]"
              aria-hidden="true"
            />
            <span
              className="absolute left-[1.65rem] top-3 w-px bg-gradient-to-b from-gold-deep to-gold transition-[height] duration-700 sm:left-[1.9rem]"
              style={{
                height: railHeight,
                transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
              }}
              aria-hidden="true"
            />

            {steps.map((step, i) => {
              const on = i === active;
              return (
                <li
                  key={step.id}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  className="relative pb-16 last:pb-0"
                >
                  <div className="flex gap-6 sm:gap-8">
                    <span
                      aria-hidden="true"
                      className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 sm:h-16 sm:w-16 ${
                        on
                          ? 'scale-110 border-gold bg-gold text-forest-deep shadow-[0_16px_40px_-16px_rgba(169,124,39,0.9)]'
                          : 'border-sage/30 bg-parchment text-olive'
                      }`}
                    >
                      <Icon name={step.icon} size={on ? 26 : 24} strokeWidth={1.5} />
                    </span>

                    <div
                      className="transition-all duration-500"
                      style={{
                        opacity: on ? 1 : 0.78,
                        transform: on ? 'translateX(0)' : 'translateX(-6px)',
                      }}
                    >
                      <span className="text-xs font-bold tracking-[0.22em] text-olive">
                        STEP {i + 1}
                      </span>
                      <h3 className="mt-2 font-serif text-2xl font-medium text-forest sm:text-4xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-lg leading-relaxed text-olive">
                        {step.body}
                      </p>
                    </div>
                  </div>

                  {/* This step's own screen, paired right beneath it — the
                      mobile stand-in for the desktop's single shared phone.
                      Fixed to this step (`step={i}`), not `active`: it
                      doesn't need scroll-tracking, it's already sitting
                      next to the text it belongs to.

                      Rendered at 80% and reserved at that scaled footprint,
                      rather than narrowed with `max-w`: everything inside
                      is fixed rem sizing, so squeezing only the width would
                      distort it into a tall, narrow strip instead of a
                      smaller phone. Scaling the whole box down keeps its
                      proportions, and reserving exactly its shrunk size
                      (not its full-size one) is what actually shortens the
                      page — a `max-w` cap alone leaves the full-height gap
                      behind, unshrunk. */}
                  <div className="mt-6 lg:hidden">
                    <div className="mx-auto w-[15.2rem] aspect-[19/33.97]">
                      <div className="w-76 origin-top-left scale-[0.8]">
                        <PhoneMock step={i} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
