import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DonateClient } from '@/components/portal/DonateClient';

export const metadata: Metadata = { title: 'Donate to partner care homes' };

/**
 * The general fund, back in service: gifts here aren't earmarked to a
 * named appeal — they go to the partner care homes Brave Homes stands
 * beside, wherever the need is greatest. Meadow Banks has its own page
 * at /campaign/meadow-banks.
 */
export default function DonatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-muted">Loading…</div>}>
      <DonateClient />
    </Suspense>
  );
}
