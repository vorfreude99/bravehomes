import { LinkButton } from '@/components/ui/Button';
import { CAMPAIGNS } from '@/lib/campaigns';
import { currency } from '@/lib/content';

/**
 * The live appeal, on the front page — a real care home asking for real
 * things at real prices, which is the most honest fundraising pitch the
 * site can make. Sits on its own warm gold wash so it reads as a moment
 * of its own between the white steps above and the dark close below.
 *
 * The wide photo is a placeholder for photographs of Meadow Banks
 * itself — swap in `public/meadow-banks-1.jpg` when the home sends one.
 */
export function CampaignSection() {
  const campaign = CAMPAIGNS['meadow-banks'];

  return (
    <section
      id="appeal"
      className="overflow-hidden py-24 sm:py-28"
      style={{
        background:
          'linear-gradient(165deg, #f6f2e7 0%, #f4ecd5 40%, #f2dfae 100%)',
      }}
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div data-reveal className="text-center">
          {/* The pill they liked — with a quiet live pulse. */}
          <span className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cream">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Live appeal
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
            {campaign.title}
          </h2>
          <p className="mt-3 font-semibold text-olive">
            {campaign.home} · Upminster
          </p>
        </div>

        {/* --------------------------- photograph --------------------------- */}
        <div data-reveal className="mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/donate-hands.jpg"
            alt="Two hands reaching for each other"
            className="aspect-[21/9] w-full rounded-3xl object-cover shadow-[0_30px_60px_-30px_rgba(47,58,35,0.55)] ring-1 ring-forest/10"
            loading="lazy"
          />
        </div>

        {/* --------------------- what the money buys ----------------------- */}
        <div data-reveal className="mt-8 grid gap-4 sm:grid-cols-2">
          {campaign.items.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border-l-4 border-gold bg-white/80 p-6 shadow-[0_14px_35px_-24px_rgba(47,58,35,0.45)] backdrop-blur-sm"
            >
              <p className="text-lg font-bold text-gold-ink">{currency.format(item.amount)}</p>
              <h3 className="mt-1 font-serif text-xl font-medium text-forest">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-olive">{item.detail}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-10 text-center">
          <LinkButton
            href={`/campaign/${campaign.id}`}
            variant="primary"
            size="lg"
            className="cta-sheen"
          >
            Help raise {currency.format(campaign.goal)}
          </LinkButton>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-olive/80">
            No account needed — anyone can give, and 100% of every
            donation reaches the appeal.
          </p>
        </div>
      </div>
    </section>
  );
}
