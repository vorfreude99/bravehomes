'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerifyAgeClient } from '@/components/auth/VerifyAgeClient';
import { Notice } from '@/components/ui/Field';

const POLL_MS = 1500;
// Didit's live processing has been observed taking ~36s after the
// redirect back, so give it a wide margin before offering "try again".
// Most results land within a few seconds; the staged copy below keeps
// the rare slow one from feeling frozen.
const TIMEOUT_MS = 90000;
const SLOW_AFTER_MS = 10000;

/**
 * Where Didit's hosted flow sends the browser back to.
 *
 * The decision can land a moment after this redirect does, so this page
 * polls /api/didit/status — which reconciles a pending profile directly
 * against Didit rather than waiting on the webhook — until it settles.
 */
export default function VerifyAgeCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    'checking' | 'approved' | 'declined' | 'timed-out' | 'other-device'
  >('checking');
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let alive = true;
    const startedAt = Date.now();
    const slowTimer = setTimeout(() => {
      if (alive) setSlow(true);
    }, SLOW_AFTER_MS);

    const poll = async () => {
      let current: string | undefined;
      try {
        const response = await fetch('/api/didit/status');

        // No session on this device: the person scanned Didit's QR code
        // and did the selfie on their phone, which was never signed in.
        // The signed-in screen picks the result up by itself — tell this
        // one it can be put down rather than spinning forever.
        if (response.status === 401) {
          if (alive) setStatus('other-device');
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { status?: string };
        if (response.ok) current = data.status;
      } catch {
        // Network blip — fall through to the retry below.
      }

      if (!alive) return;

      if (current === 'approved') {
        setStatus('approved');
        router.push('/portal');
        return;
      }

      if (current === 'declined') {
        setStatus('declined');
        return;
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        setStatus('timed-out');
        return;
      }

      setTimeout(() => void poll(), POLL_MS);
    };

    void poll();
    return () => {
      alive = false;
      clearTimeout(slowTimer);
    };
  }, [router]);

  return (
    <div>
      <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
        One last step
      </p>
      <h1 className="rise-in mt-3 font-serif text-4xl font-medium leading-[1.1] text-forest sm:text-[2.75rem]">
        {status === 'checking' && (slow ? 'Almost there…' : 'Checking your result…')}
        {status === 'approved' && 'You’re verified'}
        {status === 'declined' && 'We couldn’t confirm your age'}
        {status === 'timed-out' && 'Still checking'}
        {status === 'other-device' && 'All done on this device'}
      </h1>

      {status === 'checking' && (
        <p className="rise-in mt-4 text-ink-muted">
          {slow
            ? 'Your photo is still being analysed — this occasionally takes up to a minute. Hang tight, this page will move on by itself.'
            : 'This usually only takes a few seconds.'}
        </p>
      )}

      {status === 'declined' && (
        <>
          <div className="mt-6">
            <Notice tone="error">
              Brave Homes is for members 18 and older. If this doesn’t
              seem right, you can prove your age once with an ID document
              instead (passport, driving licence or national ID).
            </Notice>
          </div>
          <VerifyAgeClient retry />
        </>
      )}

      {status === 'other-device' && (
        <p className="rise-in mt-4 text-ink-muted">
          Your photo is in — you can put this down and head back to the
          screen where you signed in. It will carry on by itself.
        </p>
      )}

      {status === 'timed-out' && (
        <div className="mt-6">
          <Notice tone="info">
            This is taking longer than expected — refresh the page in a
            minute, or start again below.
          </Notice>
          <VerifyAgeClient retry />
        </div>
      )}
    </div>
  );
}
