import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { VerifyAgeClient } from '@/components/auth/VerifyAgeClient';
import { Notice } from '@/components/ui/Field';

export const metadata: Metadata = { title: 'Confirm your age' };

/** A gold numbered badge, echoing the welcome email's step cards. */
function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex items-start gap-4 rounded-2xl bg-white/70 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-forest-deep">
        {n}
      </span>
      <span>
        <span className="block font-semibold text-forest">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-olive">{body}</span>
      </span>
    </li>
  );
}

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

  const declined = status === 'declined';

  return (
    <div>
      <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
        One last step
      </p>
      <h1 className="rise-in mt-3 font-serif text-4xl font-medium leading-[1.1] text-forest sm:text-[2.75rem]">
        Let’s confirm <i className="text-olive">your age</i>
      </h1>
      <p className="rise-in mt-4 leading-relaxed text-olive" style={{ animationDelay: '120ms' }}>
        Everyone on Brave Homes is 18 or over — it’s what makes talking
        across generations here feel safe. Confirming takes about half a
        minute:
      </p>

      {declined && (
        <div className="rise-in mt-5">
          <Notice tone="error">
            We couldn’t confirm you’re 18 or older from the photo. No
            problem — you can prove it once with an ID document instead
            (passport, driving licence or national ID).
          </Notice>
        </div>
      )}

      {status === 'pending' && (
        <div className="rise-in mt-5">
          <Notice tone="info">
            Your last attempt is still being checked. You can start a new
            one below if it’s been a while.
          </Notice>
        </div>
      )}

      <ul className="rise-in mt-6 space-y-3" style={{ animationDelay: '200ms' }}>
        {declined ? (
          <>
            <Step n={1} title="Have your ID handy" body="A passport, driving licence or national ID — any of them works." />
            <Step n={2} title="Snap it, then a quick selfie" body="Your phone camera does both. The date of birth on the document settles it." />
            <Step n={3} title="You’re in" body="Straight to the portal — you won’t be asked again." />
          </>
        ) : (
          <>
            <Step n={1} title="Tap the button below" body="You’ll hop over to Didit, our verification partner." />
            <Step n={2} title="Take a quick live photo" body="Just your face, on your phone — no documents needed." />
            <Step n={3} title="You’re in" body="A few seconds later you’re through to the portal." />
          </>
        )}
      </ul>

      <VerifyAgeClient retry={declined || status === 'pending'} />

      <p className="rise-in mt-5 text-center text-sm leading-relaxed text-ink-muted" style={{ animationDelay: '260ms' }}>
        Your photo is checked securely by Didit and never stored on Brave
        Homes — and it never becomes your profile picture.
      </p>
    </div>
  );
}
