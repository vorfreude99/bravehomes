import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { adminDb, stripe } from '@/lib/stripe';

/**
 * Stripe tells us what actually happened.
 *
 * This is the only place a pledge becomes `paid`. The browser is never
 * believed about money: a redirect to the thank-you page proves the
 * customer came back, not that the card cleared.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature.' }, { status: 400 });
  }

  // The raw body, not the parsed one — the signature is over the bytes.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    // An unverified payload is somebody pretending to be Stripe.
    return NextResponse.json({ error: 'Bad signature.' }, { status: 400 });
  }

  const db = adminDb();

  // Cards confirm instantly; a bank debit or a payment needing extra bank
  // approval can take longer, arriving via this same event whenever it
  // actually clears — so this one handler covers both.
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const pledgeId = intent.metadata?.pledgeId;
    if (pledgeId) {
      await db
        .from('pledges')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent: intent.id,
        })
        .eq('id', pledgeId);
    }
  }

  if (
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'payment_intent.canceled'
  ) {
    const intent = event.data.object as Stripe.PaymentIntent;
    const pledgeId = intent.metadata?.pledgeId;
    if (pledgeId) {
      await db.from('pledges').update({ status: 'failed' }).eq('id', pledgeId);
    }
  }

  // A refund — full or partial — from the Stripe dashboard.
  //
  // `amount_refunded` can be less than `amount`: a partial refund stays
  // `status: 'paid'` (still a real gift, just for less than it first
  // looked like) and every total subtracts `refunded_amount` from it.
  // Only a *full* refund flips `status` to 'refunded', which is what
  // drops it out of the totals entirely — a partial one deliberately
  // doesn't, since some of the money still genuinely arrived.
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const intentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (intentId) {
      // `pledges.amount` is whole pounds (an integer column — donations
      // were never fractional to begin with), but a partial refund can
      // still be for an amount that isn't a round number of pounds, e.g.
      // £5.53 back on a £20 gift. `refunded_amount` is an integer too,
      // so this has to round somewhere — flooring rather than rounding
      // to the nearest pound guarantees it can never round *up* past the
      // original `amount`, which would otherwise make "amount minus
      // refunded_amount" go negative everywhere that total is shown.
      const refundedAmount = Math.floor((charge.amount_refunded ?? 0) / 100);
      const fullyRefunded = (charge.amount_refunded ?? 0) >= charge.amount;
      await db
        .from('pledges')
        .update({
          refunded_amount: refundedAmount,
          status: fullyRefunded ? 'refunded' : 'paid',
        })
        .eq('stripe_payment_intent', intentId);
    }
  }

  // Always 200 on a verified event, or Stripe retries for days over
  // something we have already dealt with.
  return NextResponse.json({ received: true });
}
