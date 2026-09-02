import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { VerifyAgeClient } from '@/components/auth/VerifyAgeClient';
import { Notice } from '@/components/ui/Field';

export const metadata: Metadata = { title: 'Confirm your age' };

/**
 * The gate `src/proxy.ts` sends anyone who isn't age_verification_status
 * 'approved' to before they can reach /portal at all — see the plan for
 * why (Brave Homes connects members directly, often across generations,
 * so who someone actually is matters more here than on most sites).
 */
export default async function VerifyAgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/verify-age');

  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verification_status')
    .eq('id', user.id)
    .maybeSingle();

  const status = profile?.age_verification_status ?? 'unverified';

  if (status === 'approved') redirect('/portal');

  return (
    <div>
      <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
        One last step
      </p>
      <h1 className="rise-in mt-3 text-3xl font-medium leading-[1.1] tracking-tight text-forest sm:text-4xl">
        Let’s confirm your age
      </h1>
      <p className="rise-in mt-4 text-ink-muted">
        Brave Homes connects people directly, often across generations —
        we ask everyone to confirm they’re 18 or older before using it.
        This takes a moment: a quick, live photo, checked by our
        verification partner. We never see or keep the image ourselves.
      </p>

      {status === 'declined' && (
        <div className="mt-6">
          <Notice tone="error">
            We couldn’t confirm you’re 18 or older from the photo. No
            problem — you can prove it once with an ID document instead
            (passport, driving licence or national ID).
          </Notice>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-6">
          <Notice tone="info">
            Your last attempt is still being checked. You can start a new
            one below if it’s been a while.
          </Notice>
        </div>
      )}

      <VerifyAgeClient retry={status === 'declined' || status === 'pending'} />
    </div>
  );
}
