import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { currency } from '@/lib/content';

/**
 * The live appeal, on the front page — a real care home asking for real
 * things at real prices, which is the most honest fundraising pitch the
 * site can make. One card, one link; the appeal page does the rest.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];

  return (
    <section id="appeal" className="bg-cream-deep/60 py-24 sm:py-28">
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

        <div data-reveal className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {campaign.items.map((item) => (
            <div key={item.label} className="card-solid border-l-4 border-gold p-6">
              <p className="text-lg font-bold text-gold-ink">{currency.format(item.amount)}</p>
              <h3 className="mt-1 font-serif text-xl font-medium text-forest">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-olive">{item.detail}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-10 text-center">
          <LinkButton href={`/campaign/${campaign.id}`} variant="gold" size="lg" className="cta-sheen">
            Help raise {currency.format(campaign.goal)}
          </LinkButton>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
            No account needed — anyone can give, and 100% of every
            donation reaches the appeal.
          </p>
        </div>
      </div>
    </section>
  );
}
