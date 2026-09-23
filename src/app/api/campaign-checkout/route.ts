import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb, paymentsConfigured, stripe, toPence } from '@/lib/stripe';
import { getCampaign } from '@/lib/campaigns';

/** Same guard rails as the member donate flow, in pounds. */
const MIN = 1;
const MAX = 10_000;

/**
 * Starts a campaign donation. Mirrors /api/checkout — signed-in members
 * only, by choice: every gift belongs to an account — with one
 * difference: the pledge carries the appeal's id instead of 'general',
 * so the money stays traceable to what it was given for all the way
 * through Stripe and the database.
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

  let body: { amount?: unknown; campaignId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const campaign = getCampaign(typeof body.campaignId === 'string' ? body.campaignId : '');
  if (!campaign) {
    return NextResponse.json({ error: 'No such appeal.' }, { status: 404 });
  }

  // Whole pounds only — pledges.amount is an integer column, and a
  // £10.50 would otherwise either fail opaquely or record a different
  // amount than Stripe charges.
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount < MIN || amount > MAX) {
    return NextResponse.json(
      { error: `Please choose a whole-pound amount between £${MIN} and £${MAX.toLocaleString()}.` },
      { status: 400 },
    );
  }

  // The intent row first, through the member's own client so RLS
  // vouches for it — if Stripe succeeds and this had failed, we would
  // have taken money with nothing recording who gave it.
  const { data: pledge, error } = await supabase
    .from('pledges')
    .insert({ user_id: user.id, amount, project_id: campaign.id, status: 'intent' })
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
    receipt_email: user.email ?? undefined,
    description: `Donation — ${campaign.home} appeal`,
    metadata: { pledgeId: pledge.id, userId: user.id, projectId: campaign.id },
  });

  await adminDb()
    .from('pledges')
    .update({ stripe_payment_intent: intent.id })
    .eq('id', pledge.id);

  return NextResponse.json({ clientSecret: intent.client_secret });
}
