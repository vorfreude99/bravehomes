import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DonateClient } from '@/components/portal/DonateClient';

export const metadata: Metadata = { title: 'Donate' };

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-muted">Loading…</div>}>
      <DonateClient />
    </Suspense>
  );
}
