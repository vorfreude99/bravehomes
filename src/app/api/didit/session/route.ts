import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  adminDb,
  createDiditSession,
  diditConfigured,
  reconcileAgeVerification,
} from '@/lib/didit';

/**
 * Starts a Didit verification session for the signed-in member.
 *
 * Mirrors /api/checkout: the session is opened server-side, tagged with
 * our own user id so the webhook can find its way back, and the pending
 * status is written through the service-role client since the
 * `guard_age_verification` trigger blocks the member's own session from
 * touching that column.
 */
export async function POST(request: Request) {
  if (!diditConfigured()) {
    return NextResponse.json(
      { error: 'Age verification is not switched on yet.' },
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

  // A "try again" click can race a result that already landed — Didit
  // can take half a minute to decide, longer than the callback page
  // waits. Settle the pending attempt first rather than abandoning it.
  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verification_status, age_verification_session_id')
    .eq('id', user.id)
    .maybeSingle();

  if (
    profile?.age_verification_status === 'pending' &&
    profile.age_verification_session_id
  ) {
    const settled = await reconcileAgeVerification(
      user.id,
      profile.age_verification_session_id,
    );
    if (settled === 'approved') {
      return NextResponse.json({ verified: true });
    }
  }

  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await createDiditSession(user.id, origin);
  } catch (err) {
    console.error('createDiditSession failed:', err);
    return NextResponse.json(
      { error: 'Could not start verification. Please try again.' },
      { status: 500 },
    );
  }

  await adminDb()
    .from('profiles')
    .update({
      age_verification_status: 'pending',
      age_verification_session_id: session.session_id,
    })
    .eq('id', user.id);

  return NextResponse.json({ url: session.url });
}
