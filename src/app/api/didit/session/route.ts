import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb, createDiditSession, diditConfigured } from '@/lib/didit';

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
