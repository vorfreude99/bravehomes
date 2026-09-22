import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb, paymentsConfigured, stripe, toPence } from '@/lib/stripe';
import { getCampaign } from '@/lib/campaigns';

/** Same guard rails as the member donate flow, in pounds. */
const MIN = 1;
const MAX = 10_000;

/**
 * Starts a campaign donation — from anyone.
 *
 * Unlike /api/checkout this needs no account: a resident's family or a
 * neighbour landing on the appeal page can give straight away. A
 * signed-in member's gift is still attached to their account; an
 * anonymous gift stores only whatever email they offer for a receipt.
 * Either way the pledge row is written server-side (service role, since
 * the RLS insert policy is members-only by design) before any card is
 * touched, and carries the campaign id so the money stays traceable.
 */
export async function POST(request: Request) {
  if (!paymentsConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not switched on yet.' },
      { status: 503 },
    );
  }

  let body: { amount?: unknown; campaignId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const campaign = getCampaign(typeof body.campaignId === 'string' ? body.campaignId : '');
  if (!campaign) {
    return NextResponse.json({ error: 'No such appeal.' }, { status: 404 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < MIN || amount > MAX) {
    return NextResponse.json(
      { error: `Please choose an amount between £${MIN} and £${MAX.toLocaleString()}.` },
      { status: 400 },
    );
  }

  // Optional — a signed-in member gets their gift on their account and
  // their receipt at their account email, exactly like /api/checkout.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const offeredEmail =
    typeof body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ? body.email.trim()
      : null;
  const receiptEmail = user?.email ?? offeredEmail ?? undefined;

  const { data: pledge, error } = await adminDb()
    .from('pledges')
    .insert({
      user_id: user?.id ?? null,
      amount,
      project_id: campaign.id,
      status: 'intent',
      donor_email: user ? null : offeredEmail,
    })
    .select('id')
    .single();

  if (error || !pledge) {
    return NextResponse.json(
      { error: 'Could not start the donation. Please try again.' },
      { status: 500 },
    );
  }

  const intent = await stripe().paymentIntents.create({
    amount: toPence(amount),
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    receipt_email: receiptEmail,
    description: `Donation — ${campaign.home} appeal`,
    metadata: {
      pledgeId: pledge.id,
      userId: user?.id ?? 'anonymous',
      projectId: campaign.id,
    },
  });

  await adminDb()
    .from('pledges')
    .update({ stripe_payment_intent: intent.id })
    .eq('id', pledge.id);

  return NextResponse.json({ clientSecret: intent.client_secret });
}
