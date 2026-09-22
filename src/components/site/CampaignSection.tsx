import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { currency } from '@/lib/content';

/**
 * The live appeal, on the front page — a real care home asking for real
 * things at real prices, which is the most honest fundraising pitch the
 * site can make. Photographs on one side, the costed asks on the other,
 * one link; the appeal page does the rest.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];

  return (
    <section id="appeal" className="overflow-hidden bg-cream-deep/60 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div data-reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
            Live appeal
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-center font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
            {campaign.title}
          </h2>
          <p className="mx-auto mt-3 text-center font-semibold text-olive">
            {campaign.home} · Upminster
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          {/* -------------------------- photographs ------------------------- */}
          {/* Same hand-placed, slightly off-axis pairing as the About page —
              people, not a stock collage. */}
          <div data-reveal className="grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/homes/couple.jpg"
              alt="An older couple laughing together outside their home"
              className="aspect-[4/5] w-full -rotate-2 rounded-3xl object-cover shadow-[0_20px_45px_-28px_rgba(47,58,35,0.5)]"
              loading="lazy"
              style={{ objectPosition: 'center 30%' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/auth-together.jpg"
              alt="A grandmother and her granddaughter laughing, cheek to cheek"
              className="mt-8 aspect-[4/5] w-full rotate-2 rounded-3xl object-cover shadow-[0_20px_45px_-28px_rgba(47,58,35,0.5)]"
              loading="lazy"
              style={{ objectPosition: 'center 25%' }}
            />
          </div>

          {/* --------------------- what the money buys ----------------------- */}
          <div data-reveal className="space-y-4">
            {campaign.items.map((item) => (
              <div key={item.label} className="card-solid border-l-4 border-gold p-6">
                <p className="text-lg font-bold text-gold-ink">{currency.format(item.amount)}</p>
                <h3 className="mt-1 font-serif text-xl font-medium text-forest">{item.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-olive">{item.detail}</p>
              </div>
            ))}

            <div className="pt-2">
              <LinkButton
                href={`/campaign/${campaign.id}`}
                variant="gold"
                size="lg"
                className="cta-sheen w-full sm:w-auto"
              >
                Help raise {currency.format(campaign.goal)}
              </LinkButton>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
                No account needed — anyone can give, and 100% of every
                donation reaches the appeal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
