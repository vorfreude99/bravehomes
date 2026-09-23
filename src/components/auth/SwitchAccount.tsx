'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * The escape hatch on the age-verification page. Without it, someone
 * signed in on an unverified account is cornered: every route leads
 * back to the age check, and the only sign-out lives inside the portal
 * they can't enter.
 */
export function SwitchAccount() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } catch {
      // Even if the network call fails, moving to /login is still the
      // most useful thing we can do.
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={busy}
      className="mx-auto mt-5 flex min-h-[var(--bh-tap)] items-center justify-center text-sm font-semibold text-olive underline underline-offset-4 hover:text-forest disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Not you? Sign out and use a different account'}
    </button>
  );
}
