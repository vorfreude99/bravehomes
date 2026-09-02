'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerifyAgeClient } from '@/components/auth/VerifyAgeClient';
import { Notice } from '@/components/ui/Field';

const POLL_MS = 2000;
const TIMEOUT_MS = 20000;

/**
 * Where Didit's hosted flow sends the browser back to.
 *
 * The decision can land a moment after this redirect does, so this page
 * polls /api/didit/status — which reconciles a pending profile directly
 * against Didit rather than waiting on the webhook — until it settles.
 */
export default function VerifyAgeCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'approved' | 'declined' | 'timed-out'>(
    'checking',
  );

  useEffect(() => {
    let alive = true;
    const startedAt = Date.now();

    const poll = async () => {
      let current: string | undefined;
      try {
        const response = await fetch('/api/didit/status');
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
    };
  }, [router]);

  return (
    <div>
      <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
        One last step
      </p>
      <h1 className="rise-in mt-3 text-3xl font-medium leading-[1.1] tracking-tight text-forest sm:text-4xl">
        {status === 'checking' && 'Checking your result…'}
        {status === 'approved' && 'You’re verified'}
        {status === 'declined' && 'We couldn’t confirm your age'}
        {status === 'timed-out' && 'Still checking'}
      </h1>

      {status === 'checking' && (
        <p className="rise-in mt-4 text-ink-muted">This usually only takes a few seconds.</p>
      )}

      {status === 'declined' && (
        <>
          <div className="mt-6">
            <Notice tone="error">
              Brave Homes is for members 18 and older. If this doesn’t
              seem right, you’re welcome to try again.
            </Notice>
          </div>
          <VerifyAgeClient retry />
        </>
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
