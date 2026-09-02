'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Field';

/**
 * Starts a Didit session and hands the browser off to it.
 *
 * A plain redirect rather than an embedded widget — Didit's own hosted
 * flow handles camera permission, lighting guidance and retries, which
 * is more than worth building fresh just to keep someone on-domain.
 */
export function VerifyAgeClient({ retry = false }: { retry?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/didit/session', { method: 'POST' });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        verified?: boolean;
        error?: string;
      };

      // The previous attempt turned out to have passed while nobody was
      // looking — no need for another selfie.
      if (response.ok && data.verified) {
        window.location.href = '/portal';
        return;
      }

      if (!response.ok || !data.url) {
        setBusy(false);
        setError(data.error ?? 'Something went wrong starting verification.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setBusy(false);
      setError('We could not reach the verification page. Please check your connection.');
    }
  }

  return (
    <div className="mt-6">
      <Button
        onClick={() => void start()}
        disabled={busy}
        variant="gold"
        size="lg"
        className="cta-sheen press w-full"
      >
        {busy ? 'One moment…' : retry ? 'Try again' : 'Confirm my age'}
      </Button>
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </div>
  );
}
