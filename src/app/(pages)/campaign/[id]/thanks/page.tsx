import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCampaign } from '@/lib/campaigns';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Thank you' };

/**
 * Where a bank-redirect payment (and only that kind — cards confirm in
 * place) lands after the bank hands the giver back. Public, because the
 * giver usually isn't a member. The webhook, not this page, is what
 * actually records the payment.
 */
export default async function CampaignThanksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const campaign = getCampaign((await params).id);
  if (!campaign) notFound();

  return (
    <div className="text-center">
      <p className="text-5xl" aria-hidden="true">
        💛
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-forest sm:text-5xl">
        Thank you.
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-olive">
        Your gift to {campaign.home} is on its way. If your bank asked
        you to approve the payment, it can take a moment to confirm —
        your receipt will arrive by email once it does.
      </p>
      <div className="mt-8 flex justify-center">
        <LinkButton href={`/campaign/${campaign.id}`} variant="gold" size="lg">
          Back to the appeal
        </LinkButton>
      </div>
    </div>
  );
}
