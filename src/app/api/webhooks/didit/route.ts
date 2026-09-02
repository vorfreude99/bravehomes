import { NextResponse } from 'next/server';
import { adminDb, ageStatusFromDecision, getDiditDecision, verifyDiditWebhook } from '@/lib/didit';

/**
 * Didit tells us what actually happened.
 *
 * Approval is written here or by /api/didit/status (which reconciles
 * directly against Didit when this webhook is late or unreachable) —
 * both run ageStatusFromDecision, nothing else moves the column.
 * Mirrors /api/webhooks/stripe: raw body for signature verification,
 * service-role client to write (the guard_age_verification trigger
 * blocks everyone else), and always 200 once the signature checks out
 * so Didit doesn't retry for days over something already handled.
 */
export async function POST(request: Request) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('x-signature-v2') ?? request.headers.get('x-signature');
  const timestamp = request.headers.get('x-timestamp');
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'No signature.' }, { status: 400 });
  }

  // The raw body, not the parsed one — the signature is over the bytes
  // (well, the canonical re-serialisation of them; see verifyDiditWebhook).
  const raw = await request.text();

  if (!verifyDiditWebhook(raw, timestamp, signature)) {
    return NextResponse.json({ error: 'Bad signature.' }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    webhook_type?: string;
    session_id?: string;
    vendor_data?: string;
    status?: string;
  };

  const db = adminDb();

  if (event.webhook_type === 'status.updated' && event.session_id && event.vendor_data) {
    const userId = event.vendor_data;

    // Don't trust the webhook's own decision blob — go fetch it fresh.
    let decision: unknown = null;
    if (event.status === 'Approved') {
      try {
        decision = await getDiditDecision(event.session_id);
      } catch (err) {
        console.error('getDiditDecision failed:', err);
      }
    }

    const next = ageStatusFromDecision(event.status, decision);

    if (next !== 'pending') {
      await db
        .from('profiles')
        .update({ age_verification_status: next })
        .eq('id', userId)
        .eq('age_verification_session_id', event.session_id);
    }
  }

  return NextResponse.json({ received: true });
}
