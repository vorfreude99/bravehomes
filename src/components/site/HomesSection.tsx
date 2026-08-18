'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { LinkButton } from '@/components/ui/Button';
import { currency, projects } from '@/lib/content';
import { HomesCarousel } from './HomesCarousel';

/**
 * Stock photography from Unsplash, fetched by
 * `scripts/fetch-homes-photos.mjs`. Real photographs of real places,
 * standing in until Brave Homes has pictures of its own sites — replace
 * the files in `public/homes/` and nothing here changes.
 */
const PHOTOS = [
  { src: '/homes/works.jpg', position: 'center' },
  { src: '/homes/couple.jpg', position: 'center 22%' },
  { src: '/homes/children.jpg', position: 'center 45%' },
];

const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);
const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
const totalPct = Math.round((totalRaised / totalGoal) * 100);

export function HomesSection() {
  const wrap = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const [slotHeight, setSlotHeight] = useState(0);

  /**
   * Pinning only earns its keep where there is a screen to pin to. On a
   * phone the heading and the buttons leave the carousel about 230px,
   * and fitting to that shrank the cards to 130px wide — unreadable.
   * Below this size the section is ordinary flow and the carousel falls
   * back to advancing as it crosses the viewport.
   *
   * Starts false so the server and the first client paint agree; the
   * layout effect flips it before paint, and the section is far below
   * the fold either way.
   */
  const [pinned, setPinned] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (min-height: 640px)');
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    const el = slot.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSlotHeight(el.clientHeight));
    ro.observe(el);
    setSlotHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      id="homes"
      ref={wrap}
      className="relative border-y border-sage/25 bg-sage-mist"
      // One screen to look at, plus a share of travel for each build.
      // No `overflow-hidden` anywhere above the sticky child — an
      // overflow ancestor becomes the scroll container and stops it
      // sticking at all.
      style={
        pinned
          ? { height: `calc(100svh + ${(projects.length - 1) * 62 + 20}svh)` }
          : undefined
      }
    >
      {/* A soft light off the top so the sage ground is not a flat slab.
          No globe: a rotating planet is the wrong image for a charity
          laying bricks in Britain, and its markers landed on the text. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 65%)',
        }}
        aria-hidden="true"
      />

      <div
        className={`flex flex-col px-5 sm:px-8 ${
          pinned
            ? 'sticky top-0 h-svh overflow-hidden pb-6 pt-24 sm:pb-8'
            : 'py-20'
        }`}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        {/* ------------------------------- Header ------------------------------- */}
        <div className="grid shrink-0 items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <p className="reveal text-xs font-bold tracking-[0.3em] text-gold-ink">
              THE HOMES
            </p>

            <h2 className="mt-3 font-serif text-3xl font-medium leading-[1.02] text-forest sm:text-5xl [@media(max-height:840px)]:sm:text-4xl">
              <span className="line-mask">
                <span style={{ animationDelay: '40ms' }}>Real bricks,</span>
              </span>
              <span className="line-mask">
                <span style={{ animationDelay: '140ms' }}>in real places</span>
              </span>
            </h2>

            <p
              className="reveal mt-4 hidden max-w-xl leading-relaxed text-olive sm:block [@media(max-height:840px)]:sm:hidden"
              data-delay="120"
            >
              Brave Homes is a UK charity, and the first homes are being built
              here. Every one is a place someone will actually live — and you can
              watch each one go up, brick by brick.
            </p>
          </div>

          {/* The appeal at a glance. Not a panel — a panel here made it
              another glass box. A figure on a rule reads as a stated fact. */}
          <div className="reveal lg:pb-2" data-delay="200">
            <p className="text-xs font-bold tracking-[0.24em] text-sage-ink">
              RAISED SO FAR
            </p>
            <p className="mt-2 font-serif text-4xl font-medium leading-none text-forest sm:text-6xl [@media(max-height:840px)]:sm:text-5xl">
              {currency.format(totalRaised)}
            </p>

            <div
              className="mt-4 h-px w-full bg-forest/15"
              role="progressbar"
              aria-valuenow={totalPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Total funding progress across all homes"
            >
              <div className="h-px bg-gold" style={{ width: `${totalPct}%` }} />
            </div>

            <p className="mt-3 text-sm text-olive">
              <span className="font-bold text-forest">{totalPct}%</span> of the{' '}
              {currency.format(totalGoal)} needed —{' '}
              {currency.format(totalGoal - totalRaised)} still to find.
            </p>
          </div>
        </div>

        <div ref={slot} className={`pb-2 pt-3 ${pinned ? "min-h-0 flex-1" : ""}`}>
          <HomesCarousel
            projects={projects}
            photos={PHOTOS}
            driver={pinned ? wrap : undefined}
            boundHeight={pinned ? slotHeight : 0}
          />
        </div>

        <div className="mt-8 flex shrink-0 flex-wrap justify-center gap-3">
          <LinkButton href="/portal/donate" variant="primary" size="lg">
            Give to a home
          </LinkButton>
          <LinkButton href="/portal/homes" variant="secondary" size="lg">
            Follow the builds
          </LinkButton>
        </div>
        </div>
      </div>
    </section>
  );
}
