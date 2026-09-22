import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { currency } from '@/lib/content';

/**
 * The live appeal: a calm sage panel in the site's own palette — no
 * gradients, no badges — with the ask in big serif type on the left and
 * Meadowbanks' own photographs leaning against each other on the right.
 * The layout carries the drama; the colours stay quiet.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];

  return (
    // A step deeper than sage-mist — the section above is white, so the
    // panel needs a genuinely visible tint to read as its own room.
    <section id="appeal" className="overflow-hidden bg-[#e2e9d4] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ------------------------------ the ask ------------------------- */}
          <div data-reveal>
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

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-sage-ink">
              {campaign.home} · Hall Lane, Upminster
            </p>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-olive">
              The home asked for two things: traditional and
              vintage-style furniture and décor to create a homely
              setting, and reminiscence and sensory resources — memory
              boxes, vintage household items, photographs, books, music
              and activity resources.
            </p>

            {/* The two asks as stats, not paragraphs. */}
            <div className="mt-9 flex gap-10">
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
            </div>

            <div className="mt-10">
              <LinkButton
                href={`/campaign/${campaign.id}`}
                size="lg"
                className="cta-sheen press"
              >
                Help raise {currency.format(campaign.goal)}
              </LinkButton>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                Members give in under a minute — joining is free, and
                100% of every donation reaches the home.
              </p>
            </div>
          </div>

          {/* --------------------------- the photographs -------------------- */}
          {/* Meadowbanks' own hero: the whole home and its grounds from the
              air at golden hour, with two residents walking hand in hand
              leaning in from the corner. */}
          <div data-reveal className="relative mx-auto w-full pb-12 lg:pb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meadow-banks-estate.jpg"
              alt="Meadowbanks Care Home and its gardens from above at golden hour, surrounded by Essex countryside"
              className="aspect-[16/11] w-full rotate-1 rounded-[2.5rem] object-cover shadow-[0_35px_70px_-35px_rgba(47,58,35,0.6)]"
              loading="lazy"
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meadow-banks-garden.jpg"
              alt="Two Meadowbanks residents walking hand in hand through the home's grounds"
              className="absolute -bottom-4 -left-5 z-10 hidden w-[34%] -rotate-6 rounded-3xl object-cover shadow-[0_25px_50px_-22px_rgba(47,58,35,0.55)] ring-4 ring-white sm:block lg:-left-9"
              style={{ aspectRatio: '4 / 5' }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
