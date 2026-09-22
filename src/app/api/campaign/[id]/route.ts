import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/stripe';
import { getCampaign } from '@/lib/campaigns';

/**
 * Live progress for one appeal — public, because the whole point of a
 * named campaign is that anyone can see where the money stands. Only
 * aggregates ever leave this route; individual pledges stay private.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'No such appeal.' }, { status: 404 });
  }

  const { data, error } = await adminDb()
    .from('pledges')
    .select('amount, refunded_amount')
    .eq('project_id', campaign.id)
    .eq('status', 'paid');

  if (error) {
    // The page still renders the appeal itself; it just can't show a
    // number, which beats showing a wrong one.
    return NextResponse.json({ error: 'Could not load progress.' }, { status: 500 });
  }

  const raised = (data ?? []).reduce(
    (sum, row) => sum + row.amount - (row.refunded_amount ?? 0),
    0,
  );

  return NextResponse.json({
    id: campaign.id,
    goal: campaign.goal,
    raised,
    supporters: data?.length ?? 0,
  });
}
