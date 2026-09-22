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
 * The appeal as a flagship page: the estate at golden hour as a
 * cinematic hero, each costed ask wearing its own photograph, life at
 * the home in a two-up band, then the progress bar and the card form.
 * Every picture on this page is Meadowbanks' own.
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
      {/* ------------------------------ hero ------------------------------ */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meadow-banks-estate.jpg"
          alt="Meadowbanks Care Home and its gardens from above at golden hour, surrounded by Essex countryside"
          className="h-[52vh] min-h-[380px] w-full object-cover sm:h-[64vh]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,26,12,0.25) 0%, rgba(20,26,12,0) 35%, rgba(20,26,12,0.75) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 sm:px-10 sm:pb-12">
          <div className="mx-auto max-w-7xl">
          <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] text-cream sm:text-6xl">
            Make Meadow Banks <i className="text-gold">feel like home.</i>
          </h1>
          <p className="mt-4 text-sm font-semibold text-cream/85 sm:text-base">
            {campaign.home} · {campaign.address}
          </p>
          </div>
        </div>
      </section>

      {/* -------------------- give, beside life at the home ---------------- */}
      <section id="give" className="mx-auto mt-10 max-w-7xl px-5 sm:mt-12 sm:px-8">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          {/* The four acres, holding up the left of the giving. */}
          <figure className="order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meadow-banks-garden.jpg"
              alt="Two Meadowbanks residents walking hand in hand through the home's grounds"
              className="h-full max-h-[640px] w-full rounded-2xl object-cover"
              style={{ objectPosition: 'center 40%' }}
              loading="lazy"
            />
            <figcaption className="mt-3 text-center font-serif text-lg italic text-olive">
              Life at Meadowbanks, in the four acres it calls home.
            </figcaption>
          </figure>

          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
              Every pound lands here.
            </h2>
            <CampaignClient campaignId={campaign.id} goal={campaign.goal} />
          </div>
        </div>
      </section>
    </div>
  );
}
