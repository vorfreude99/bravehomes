import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { currency } from '@/lib/content';
import { paymentsConfigured, stripe, adminDb } from '@/lib/stripe';
import { AwaitPayment } from '@/components/portal/AwaitPayment';

export const metadata = { title: 'Thank you · Brave Homes' };

const LIME = '#d7f05c';

/**
 * Where Stripe sends people afterwards — the same sky the gift was made
 * under, because arriving somewhere that looks like a different website
 * is the moment doubt creeps in.
 *
 * It reads the pledge from our own database rather than the query
 * string. Landing here means the customer came back; the webhook is what
 * knows whether the card cleared, so a payment still settling says so
 * instead of thanking someone for money that never arrived.
 */
export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { payment_intent: paymentIntentId } = await searchParams;
  if (!paymentIntentId) redirect('/portal/donate');

  const supabase = await createClient();
  const { data: fetched } = await supabase
    .from('pledges')
    .select('amount, status')
    .eq('stripe_payment_intent', paymentIntentId)
    .maybeSingle();

  let pledge = fetched;

  /**
   * The webhook usually beats the customer back to this page, but if it
   * never lands at all — wrong secret, an event type Stripe wasn't told
   * to send, retries exhausted — the pledge would otherwise sit at
   * `intent` forever, with the donor staring at "still confirming" with
   * no way out even though their card was genuinely charged. Checking
   * Stripe directly here means every one of `AwaitPayment`'s refreshes
   * is also a chance to self-heal, not just re-read a database the
   * webhook may never update.
   */
  if (pledge && pledge.status === 'intent' && paymentsConfigured()) {
    try {
      const intent = await stripe().paymentIntents.retrieve(paymentIntentId);
      if (intent.status === 'succeeded') {
        await adminDb()
          .from('pledges')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('stripe_payment_intent', paymentIntentId);
        pledge = { ...pledge, status: 'paid' };
      } else if (intent.status === 'canceled') {
        await adminDb()
          .from('pledges')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent', paymentIntentId);
        pledge = { ...pledge, status: 'failed' };
      }
    } catch {
      // Stripe unreachable or the lookup failed — fall through to the
      // existing "still confirming" state; the webhook may yet land.
    }
  }

  const paid = pledge?.status === 'paid';
  const failed = pledge?.status === 'failed';

  return (
    <div className="-mb-28 lg:-mb-6">
      <section className="relative flex min-h-[calc(100svh-5.25rem)] flex-col overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/donate-hands.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: 'rgba(84,104,124,0.38)' }}
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'linear-gradient(to top, rgba(24,34,46,0.85) 0%, rgba(24,34,46,0.35) 45%, rgba(24,34,46,0.25) 100%)',
          }}
        />

        <div className="relative flex flex-1 flex-col items-center justify-center p-6 text-center text-white sm:p-10">
          {!paid && !failed && <AwaitPayment />}

          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{ background: LIME, color: '#2b3a4a' }}
            aria-hidden="true"
          >
            {paid ? '♥' : failed ? '×' : '…'}
          </span>

          <h1 className="mt-7 text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {paid ? (
              <>
                Thank you.
                <br />
                Truly.
              </>
            ) : failed ? (
              'That didn’t go through'
            ) : (
              'Almost there'
            )}
          </h1>

          <p className="mt-5 max-w-md text-lg leading-snug text-white/85 sm:text-xl">
            {paid ? (
              <>
                {pledge?.amount ? (
                  <>
                    Your{' '}
                    <strong className="font-bold" style={{ color: LIME }}>
                      {currency.format(pledge.amount)}
                    </strong>{' '}
                    is on its way.{' '}
                  </>
                ) : null}
                Every penny of it goes towards helping care homes — better
                care, better days, for the people who live in them.
              </>
            ) : failed ? (
              'Your card was not charged — nothing was taken. You can try again whenever you are ready.'
            ) : (
              'Your payment is still being confirmed with your bank. This page will update by itself — it usually takes less than a minute.'
            )}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href={failed ? '/portal/donate' : '/portal'}
              className="inline-flex min-h-14 items-center rounded-full px-8 text-lg font-bold transition-transform hover:scale-[1.02]"
              style={{ background: LIME, color: '#2b3a4a' }}
            >
              {failed ? 'Try again' : 'Back to your dashboard'}
            </Link>
            <Link
              href="/portal/find"
              className="inline-flex min-h-14 items-center rounded-full border-2 border-white/30 px-8 text-lg font-bold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-[#2b3a4a]"
            >
              Meet the people here
            </Link>
          </div>

          {paid && (
            <p className="mt-8 text-sm text-white/55">
              A receipt is on its way to your email.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
