import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { currency } from '@/lib/content';

/**
 * The live appeal as a cinematic moment: a deep forest panel with a
 * gold glow, the ask in big serif type on the left, and Meadowbanks'
 * own photographs leaning against each other on the right under a
 * floating goal badge. Distinct from every other section on the page —
 * which is the point: this is the one asking for something.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];

  return (
    <section
      id="appeal"
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 75% 15%, rgba(240,203,77,0.16) 0%, rgba(0,0,0,0) 55%), linear-gradient(160deg, #2c3921 0%, #26301b 55%, #1e2814 100%)',
      }}
    >
      {/* A whisper of gold along the top edge, tying the panel to the
          button and the badge. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(240,203,77,0.55) 50%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ------------------------------ the ask ------------------------- */}
          <div data-reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-gold">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              Live appeal
            </span>

            <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.05] text-cream sm:text-5xl">
              Make Meadow Banks
              <br />
              <i className="text-gold">feel like home.</i>
            </h2>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-sage-soft">
              {campaign.home} · Hall Lane, Upminster
            </p>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-sage-soft">
              The home asked us for two things, and priced them to the
              pound: traditional furniture to make the sitting rooms feel
              like front rooms, and memory boxes, photographs and music
              to bring lives back within reach.
            </p>

            {/* The two asks as stats, not paragraphs. */}
            <div className="mt-9 flex gap-10">
              {campaign.items.map((item) => (
                <div key={item.label} className="border-l-2 border-gold/60 pl-4">
                  <p className="font-serif text-3xl font-medium text-gold sm:text-4xl">
                    {currency.format(item.amount)}
                  </p>
                  <p className="mt-1 max-w-[11rem] text-xs font-semibold uppercase tracking-[0.14em] text-sage-soft">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <LinkButton
                href={`/campaign/${campaign.id}`}
                variant="gold"
                size="lg"
                className="cta-sheen press"
              >
                Help raise {currency.format(campaign.goal)} →
              </LinkButton>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-sage-soft/80">
                Members give in under a minute — joining is free, and
                100% of every donation reaches the home.
              </p>
            </div>
          </div>

          {/* --------------------------- the photographs -------------------- */}
          {/* Meadowbanks' own pictures: the sitting-room corner this appeal
              multiplies, with the house itself leaning in from the corner. */}
          <div data-reveal className="relative mx-auto w-full max-w-md pb-10 lg:pb-14">
            <div className="absolute -right-3 -top-5 z-20 rotate-3 rounded-full bg-gold px-5 py-2.5 font-bold text-forest-deep shadow-[0_16px_35px_-12px_rgba(240,203,77,0.7)]">
              Goal · {currency.format(campaign.goal)}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meadow-banks-sitting.jpg"
              alt="A sitting-room corner at Meadowbanks with a velvet armchair, vintage radio and framed photographs"
              className="aspect-[4/5] w-full rotate-1 rounded-[2.5rem] object-cover shadow-[0_50px_90px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/15"
              loading="lazy"
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meadow-banks-home.jpg"
              alt="Meadowbanks Care Home on Hall Lane in evening light"
              className="absolute -bottom-2 -left-6 z-10 hidden w-[44%] -rotate-6 rounded-3xl object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.75)] ring-2 ring-cream/90 sm:block lg:-left-10"
              style={{ aspectRatio: '4 / 5' }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
