'use client';

import { useEffect, useState } from 'react';
import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { CampaignProgress } from '@/components/site/CampaignProgress';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { currency } from '@/lib/content';

/**
 * The live appeals as a carousel: slide one is the Meadow Banks appeal,
 * slide two says plainly that more are coming — which is the promise
 * the numbering makes. Arrows either side, dots underneath, calm sage
 * panel throughout.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];
  const SLIDES = 2;
  const [slide, setSlide] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  const go = (next: number) => setSlide(((next % SLIDES) + SLIDES) % SLIDES);

  // The big button sends a signed-out visitor to sign in first — the
  // appeal is theirs to read, but giving starts with an account.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      .auth.getUser()
      .then((res: { data: { user: unknown } }) => setSignedIn(Boolean(res.data.user)))
      .catch(() => setSignedIn(false));
  }, []);

  const giveHref = signedIn
    ? `/campaign/${campaign.id}`
    : `/login?next=/campaign/${campaign.id}`;
  const partnersHref = signedIn ? '/portal/donate' : '/login?next=/portal/donate';

  return (
    // A step deeper than sage-mist — the section above is white, so the
    // panel needs a genuinely visible tint to read as its own room.
    <section id="appeal" className="relative overflow-hidden bg-[#e2e9d4] py-14 sm:py-16">
      {/* ------------------------------ arrows ----------------------------- */}
      <button
        type="button"
        onClick={() => go(slide - 1)}
        aria-label="Previous appeal"
        className="group absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-forest shadow-[0_12px_28px_-10px_rgba(47,58,35,0.4)] transition-all duration-200 hover:bg-forest hover:text-cream active:scale-95 sm:left-5"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="-ml-0.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(slide + 1)}
        aria-label="Next appeal"
        className="group absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-forest shadow-[0_12px_28px_-10px_rgba(47,58,35,0.4)] transition-all duration-200 hover:bg-forest hover:text-cream active:scale-95 sm:right-5"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="-mr-0.5 transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* ------------------------------ slides ----------------------------- */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${slide * 100}%)` }}
      >
        {/* ------------------------ slide 1: Meadow Banks ------------------- */}
        <div className="w-full shrink-0 px-5 sm:px-8" aria-hidden={slide !== 0}>
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.22em] text-sage-ink">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-ink" />
                  </span>
                  Live appeal
                </p>

                <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.05] text-forest sm:text-5xl">
                  Make Meadow Banks
                  <br />
                  <i className="text-gold-ink">feel like home.</i>
                </h2>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-olive">
                  The home asked for two things: traditional and
                  vintage-style furniture and décor to create a homely
                  setting, and reminiscence and sensory resources —
                  memory boxes, vintage household items, photographs,
                  books, music and activity resources.
                </p>

                <div className="mt-7 flex items-center gap-10">
                  {campaign.items.map((item) => (
                    <div key={item.label} className="border-l-2 border-gold pl-4">
                      <p className="font-serif text-3xl font-medium text-forest sm:text-4xl">
                        {currency.format(item.amount)}
                      </p>
                      <p className="mt-1 max-w-[11rem] text-xs font-semibold uppercase tracking-[0.14em] text-sage-ink">
                        {item.label}
                      </p>
                    </div>
                  ))}
                  <CampaignProgress
                    campaignId={campaign.id}
                    goal={campaign.goal}
                    variant="ring"
                  />
                </div>

                <div className="mt-7">
                  <LinkButton
                    href={giveHref}
                    size="lg"
                    className="cta-sheen press"
                  >
                    Help raise {currency.format(campaign.goal)}
                  </LinkButton>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                    Sign in to give — it takes under a minute, joining is
                    free, and 100% of every donation reaches the home.
                  </p>
                </div>
              </div>

              <div className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/meadow-banks-estate.jpg"
                  alt="Meadowbanks Care Home and its gardens from above at golden hour, surrounded by Essex countryside"
                  className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_28px_55px_-30px_rgba(47,58,35,0.55)]"
                  loading="lazy"
                />
                <p className="mt-3 text-center text-sm font-semibold text-sage-ink">
                  {campaign.home} — {campaign.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------- slide 2: the partner homes -------------------- */}
        <div className="w-full shrink-0 px-5 sm:px-8" aria-hidden={slide !== 1}>
          <div className="mx-auto flex h-full max-w-7xl items-center">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.22em] text-sage-ink">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-ink" />
                  </span>
                  Beyond the appeal
                </p>

                <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.05] text-forest sm:text-5xl">
                  Our other
                  <br />
                  <i className="text-gold-ink">partner homes.</i>
                </h2>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-olive">
                  Brave Homes stands beside its partner care homes. A gift
                  to the partners&rsquo; fund goes wherever the need is
                  greatest: better rooms, better equipment, better days.
                </p>

                <div className="mt-8">
                  <LinkButton href={partnersHref} size="lg" className="cta-sheen press">
                    Donate to partner homes
                  </LinkButton>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                    Sign in to give — and 100% of every donation reaches
                    a care home.
                  </p>
                </div>
              </div>

              <div className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/donate-hands.jpg"
                  alt="Two hands reaching for each other"
                  className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_28px_55px_-30px_rgba(47,58,35,0.55)]"
                  loading="lazy"
                />
                <p className="mt-3 text-center text-sm font-semibold text-sage-ink">
                  Given where it&rsquo;s needed most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------- dots ------------------------------ */}
      <div className="mt-8 flex justify-center gap-2.5">
        {Array.from({ length: SLIDES }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={slide === i}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              slide === i ? 'w-7 bg-forest' : 'w-2.5 bg-sage/60 hover:bg-sage'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
