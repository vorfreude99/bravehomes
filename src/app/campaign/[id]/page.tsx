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

      {/* ------------------------------- give ------------------------------ */}
      <section id="give" className="mx-auto mt-10 max-w-3xl px-5 sm:mt-12 sm:px-8">
        <h2 className="text-center font-serif text-3xl font-medium text-forest sm:text-4xl">
          Every pound lands here.
        </h2>
        <CampaignClient campaignId={campaign.id} goal={campaign.goal} />
        <p className="mt-8 text-center leading-relaxed text-olive">
          Brave Homes is a community interest company, and our promise is
          simple: <strong className="text-forest">100% of every donation
          is applied to the cause</strong> — Stripe’s card fee is the
          only thing deducted, by Stripe, before the money reaches us.
          Nothing goes to salaries or overheads. When this appeal is
          funded, we’ll share what was bought right here.
        </p>
      </section>

      {/* --------------------- life at the home, full bleed ----------------- */}
      <section className="relative mt-14 overflow-hidden sm:mt-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meadow-banks-garden.jpg"
          alt="Two Meadowbanks residents walking hand in hand through the home's grounds"
          className="h-[44vh] min-h-[320px] w-full object-cover"
          style={{ objectPosition: 'center 42%' }}
          loading="lazy"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,26,12,0) 45%, rgba(20,26,12,0.6) 100%)',
          }}
        />
        <p className="absolute inset-x-0 bottom-6 px-5 text-center font-serif text-xl italic text-cream sm:text-2xl">
          Life at Meadowbanks, in the four acres it calls home.
        </p>
      </section>

      {/* ------------------------- story + the asks ------------------------ */}
      <section className="mx-auto mt-10 max-w-4xl px-5 text-center sm:mt-12 sm:px-8">
        <p className="text-lg leading-relaxed text-olive sm:text-xl">
          {campaign.story}
        </p>
      </section>

      {/* ----------------------- the asks, editorial ----------------------- */}
      <section className="mx-auto mt-14 max-w-6xl px-5 sm:mt-16 sm:px-8">
        <h2 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
          Exactly what {currency.format(campaign.goal)} buys
        </h2>

        {/* Two feature rows, magazine-style: the photograph on one side,
            the price set large in serif on the other. No boxes. */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meadow-banks-sitting.jpg"
            alt="A sitting-room corner at Meadowbanks: velvet armchair, vintage radio and framed photographs of old film stars"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
            loading="lazy"
          />
          <div>
            <p className="font-serif text-6xl font-medium text-forest sm:text-7xl">
              {currency.format(campaign.items[0].amount)}
            </p>
            <div className="mt-4 h-0.5 w-14 bg-gold" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl font-medium text-forest">
              {campaign.items[0].label}
            </h3>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-olive">
              {campaign.items[0].detail}
            </p>
          </div>
        </div>

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14 sm:mt-16">
          <div className="order-2 lg:order-1">
            <p className="font-serif text-6xl font-medium text-forest sm:text-7xl">
              {currency.format(campaign.items[1].amount)}
            </p>
            <div className="mt-4 h-0.5 w-14 bg-gold" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl font-medium text-forest">
              {campaign.items[1].label}
            </h3>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-olive">
              {campaign.items[1].detail}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meadow-banks-smile.jpg"
            alt="A Meadowbanks resident beaming with a small dog on his lap"
            className="order-1 aspect-[4/3] w-full rounded-2xl object-cover lg:order-2"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}
