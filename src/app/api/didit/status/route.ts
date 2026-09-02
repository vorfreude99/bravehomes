import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb, ageStatusFromDecision, diditConfigured, getDiditDecision } from '@/lib/didit';

/**
 * The signed-in member's age verification status — reconciled, not just
 * read.
 *
 * The webhook is the normal path, but it can be late or unreachable
 * (localhost dev has no public URL at all), so a pending profile is
 * checked directly against Didit's decision endpoint here, through the
 * same ageStatusFromDecision the webhook uses. The callback page polls
 * this instead of the raw profile row.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verification_status, age_verification_session_id')
    .eq('id', user.id)
    .maybeSingle();

  let status = profile?.age_verification_status ?? 'unverified';

  if (status === 'pending' && profile?.age_verification_session_id && diditConfigured()) {
    let decision: unknown = null;
    try {
      decision = await getDiditDecision(profile.age_verification_session_id);
    } catch {
      // Didit may still be processing — the decision endpoint 404s until
      // there is one. Stay pending and let the next poll try again.
    }

    if (decision != null) {
      const next = ageStatusFromDecision((decision as { status?: string }).status, decision);
      if (next !== 'pending') {
        await adminDb()
          .from('profiles')
          .update({ age_verification_status: next })
          .eq('id', user.id)
          .eq('age_verification_session_id', profile.age_verification_session_id);
        status = next;
      }
    }
  }

  return NextResponse.json({ status });
}
