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

/** The two asks, each with the Meadowbanks photograph that shows it. */
const ITEM_PHOTOS: Record<string, { src: string; alt: string }> = {
  'Vintage furniture & décor': {
    src: '/meadow-banks-sitting.jpg',
    alt: 'A sitting-room corner at Meadowbanks: velvet armchair, vintage radio and framed photographs of old film stars',
  },
  'Reminiscence & sensory resources': {
    src: '/meadow-banks-smile.jpg',
    alt: 'A Meadowbanks resident beaming with a small dog on his lap',
  },
};

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
    <div className="mx-auto max-w-6xl">
      {/* ------------------------------ hero ------------------------------ */}
      <section className="relative overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-40px_rgba(20,26,12,0.7)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meadow-banks-estate.jpg"
          alt="Meadowbanks Care Home and its gardens from above at golden hour, surrounded by Essex countryside"
          className="aspect-[4/3] w-full object-cover sm:aspect-[21/10]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,26,12,0.25) 0%, rgba(20,26,12,0) 35%, rgba(20,26,12,0.75) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
            Brave Homes appeal · No. {campaign.number}
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium leading-[1.05] text-cream sm:text-6xl">
            Make Meadow Banks <i className="text-gold">feel like home.</i>
          </h1>
          <p className="mt-4 text-sm font-semibold text-cream/85 sm:text-base">
            {campaign.home} · {campaign.address}
          </p>
        </div>
      </section>

      {/* ------------------------- story + the asks ------------------------ */}
      <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
        <p className="text-lg leading-relaxed text-olive sm:text-xl">
          {campaign.story}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-center font-serif text-3xl font-medium text-forest sm:text-4xl">
          Exactly what {currency.format(campaign.goal)} buys
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2">
          {campaign.items.map((item) => {
            const photo = ITEM_PHOTOS[item.label];
            return (
              <div
                key={item.label}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-30px_rgba(47,58,35,0.5)]"
              >
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-serif text-xl font-medium text-forest">
                      {item.label}
                    </h3>
                    <p className="font-serif text-2xl font-medium text-gold-ink">
                      {currency.format(item.amount)}
                    </p>
                  </div>
                  <p className="mt-2 leading-relaxed text-olive">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------- life at the home ----------------------- */}
      <section className="mt-16 sm:mt-20">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-sage-ink">
          Life at Meadowbanks
        </p>
        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meadow-banks-garden.jpg"
            alt="Two Meadowbanks residents walking hand in hand through the home's grounds"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-[0_24px_50px_-30px_rgba(47,58,35,0.5)]"
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meadow-banks-home.jpg"
            alt="Meadowbanks Care Home's entrance on Hall Lane, with hanging flower baskets, in evening light"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-[0_24px_50px_-30px_rgba(47,58,35,0.5)]"
            loading="lazy"
          />
        </div>
      </section>

      {/* ------------------------------- give ------------------------------ */}
      <section id="give" className="mx-auto mt-16 max-w-2xl sm:mt-20">
        <h2 className="text-center font-serif text-3xl font-medium text-forest sm:text-4xl">
          Every pound lands here.
        </h2>
        <CampaignClient campaignId={campaign.id} goal={campaign.goal} />
        <p className="mt-10 text-center leading-relaxed text-olive">
          Brave Homes is a community interest company, and our promise is
          simple: <strong className="text-forest">100% of every donation
          is applied to the cause</strong> — Stripe’s card fee is the
          only thing deducted, by Stripe, before the money reaches us.
          Nothing goes to salaries or overheads. When this appeal is
          funded, we’ll share what was bought right here.
        </p>
      </section>
    </div>
  );
}
