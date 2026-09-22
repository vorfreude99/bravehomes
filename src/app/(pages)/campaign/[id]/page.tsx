import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CAMPAIGNS, getCampaign } from '@/lib/campaigns';
import { CampaignClient } from '@/components/site/CampaignClient';
import { currency } from '@/lib/content';

export function generateStaticParams() {
  return Object.keys(CAMPAIGNS).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const campaign = getCampaign((await params).id);
  if (!campaign) return {};
  return {
    title: campaign.title,
    description: `${campaign.home} needs ${currency.format(campaign.goal)} — see exactly what it buys and give in a minute.`,
  };
}

/**
 * A public appeal page: no account, no sign-in, no age wall between a
 * resident's granddaughter and a £10 gift. The costed list is the whole
 * pitch — a named home asked for named things at named prices, and this
 * page shows the money landing against them.
 */
export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaign = getCampaign((await params).id);
  if (!campaign) notFound();

  return (
    <div>
      <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
        A Brave Homes appeal
      </p>
      <h1 className="rise-in mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        {campaign.title}
      </h1>
      <p className="rise-in mt-3 font-semibold text-olive">
        {campaign.home} · {campaign.address}
      </p>

      {/* Meadowbanks' own photograph — one of the rooms this appeal helps. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/meadow-banks-bedroom.jpg"
        alt="A bright resident's room at Meadowbanks, with an armchair by the window overlooking the trees"
        className="rise-in mt-8 aspect-[2/1] w-full rounded-3xl object-cover shadow-[0_24px_50px_-30px_rgba(47,58,35,0.55)]"
        style={{ animationDelay: '120ms' }}
      />

      <p className="rise-in mt-6 text-lg leading-relaxed text-olive" style={{ animationDelay: '150ms' }}>
        {campaign.story}
      </p>

      {/* --------------------- what the money buys --------------------- */}
      <h2 className="mt-12 font-serif text-3xl font-medium text-forest">
        Exactly what {currency.format(campaign.goal)} buys
      </h2>
      <div className="mt-6 space-y-4">
        {campaign.items.map((item) => (
          <div key={item.label} className="card-solid border-l-4 border-gold p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-xl font-medium text-forest">{item.label}</h3>
              <p className="text-lg font-bold text-gold-ink">{currency.format(item.amount)}</p>
            </div>
            <p className="mt-2 leading-relaxed text-olive">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* ------------------------- progress + give ------------------------ */}
      <CampaignClient campaignId={campaign.id} goal={campaign.goal} />

      <p className="mt-10 leading-relaxed text-olive">
        Brave Homes is a community interest company, and our promise is
        simple: <strong className="text-forest">100% of every donation is
        applied to the cause</strong> — Stripe’s card fee is the only
        thing deducted, by Stripe, before the money reaches us. Nothing
        goes to salaries or overheads. When this appeal is funded, we’ll
        share what was bought right here.
      </p>
    </div>
  );
}
