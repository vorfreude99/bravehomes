import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb, paymentsConfigured, stripe, toPence } from '@/lib/stripe';

/** Guard rails on the amount, in pounds. */
const MIN = 1;
const MAX = 10_000;

/** Donations aren't earmarked to any named project — every gift goes
    wherever the need actually is, so there is nothing to look up here. */
const GENERAL_PROJECT_ID = 'general';
const GENERAL_PROJECT_NAME = 'Supporting care for those who need it';

/**
 * Starts a donation.
 *
 * The amount is read from the request body on the server, never trusted
 * from a hidden field, and the pledge row is written before the customer
 * leaves so a completed payment always has something to attach itself to.
 */
export async function POST(request: Request) {
  if (!paymentsConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not switched on yet.' },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  let body: { amount?: unknown; projectId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount < MIN || amount > MAX) {
    return NextResponse.json(
      { error: `Please choose an amount between £${MIN} and £${MAX.toLocaleString()}.` },
      { status: 400 },
    );
  }

  // The intent row first: if Stripe succeeds and this had failed, we
  // would have taken money with nothing recording who gave it.
  const { data: pledge, error } = await supabase
    .from('pledges')
    .insert({ user_id: user.id, amount, project_id: GENERAL_PROJECT_ID, status: 'intent' })
    .select('id')
    .single();

  if (error || !pledge) {
    return NextResponse.json(
      { error: 'Could not start the donation. Please try again.' },
      { status: 500 },
    );
  }

  // A PaymentIntent rather than a hosted Checkout Session: the card
  // form is rendered on the donate page itself, in the site's own
  // colours and type, instead of handing the giver off to a page that
  // looks like Stripe's rather than Brave Homes'.
  const intent = await stripe().paymentIntents.create({
    amount: toPence(amount),
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    receipt_email: user.email ?? undefined,
    description: `Donation — ${GENERAL_PROJECT_NAME}`,
    // Both the pledge and the giver travel with the intent, so the
    // webhook never has to guess which row a payment belongs to.
    metadata: { pledgeId: pledge.id, userId: user.id, projectId: GENERAL_PROJECT_ID },
  });

  // Service-role, because `pledges` has no update policy for ordinary
  // users — that restriction is what stops anyone marking themselves
  // paid, and it applies to this bookkeeping write too.
  await adminDb()
    .from('pledges')
    .update({ stripe_payment_intent: intent.id })
    .eq('id', pledge.id);

  return NextResponse.json({ clientSecret: intent.client_secret });
}
