'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHead, useSessionUser } from './PortalShell';
import { DonateWidget } from '@/components/site/DonateWidget';
import { Notice } from '@/components/ui/Field';
import { Flag } from '@/components/ui/Flag';
import { recordPledge } from '@/lib/db';
import { currency, projects } from '@/lib/content';

export function DonateClient() {
  const me = useSessionUser();
  const params = useSearchParams();

  const amountParam = Number.parseFloat(params.get('amount') ?? '');
  const initialAmount = Number.isFinite(amountParam) ? amountParam : undefined;
  const initialProjectId = params.get('project') ?? undefined;

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);

  async function onPledge(amount: number, projectId: string) {
    setBusy(true);
    setNotice(null);
    setSetupNeeded(false);

    const result = await recordPledge(me.id, amount, projectId);
    setBusy(false);

    if (result.ok) {
      const project = projects.find((p) => p.id === projectId);
      setNotice(
        `Thank you. Your pledge of ${currency.format(amount)} for ${
          project?.name ?? 'the build'
        } is recorded. Card payment isn’t connected yet — the team will be in touch to complete it.`,
      );
      return;
    }

    if (result.reason === 'no-table') {
      setSetupNeeded(true);
      return;
    }

    setNotice(`We couldn’t save that pledge: ${result.message}`);
  }

  return (
    <>
      <PageHead
        title="Every penny goes to people who need it"
        subtitle="We don’t take a single penny from donations. 100% goes directly to building and running care homes and children’s homes around the world."
      />

      <div className="px-5 py-10 sm:px-8">
        {setupNeeded && (
          <div className="mb-8">
            <Notice tone="error">
              Pledges can’t be saved yet — the <code>pledges</code> table doesn’t
              exist in Supabase. Create it (columns: <code>user_id</code> uuid,{' '}
              <code>amount</code> numeric, <code>project_id</code> text,{' '}
              <code>created_at</code> timestamptz) and this will start working.
            </Notice>
          </div>
        )}

        <DonateWidget
          mode="full"
          onPledge={onPledge}
          busy={busy}
          notice={notice}
          initialAmount={initialAmount}
          initialProjectId={initialProjectId}
        />

        <section className="card-solid mt-12 p-7">
          <h2 className="font-serif text-2xl font-medium text-forest">
            Where the money actually goes
          </h2>
          <ul className="mt-5 space-y-4">
            {projects.map((p) => {
              const pct = Math.min(100, Math.round((p.raised / p.goal) * 100));
              return (
                <li key={p.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-semibold text-forest">
                      <Flag region={p.region} size={20} />
                      {p.name}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {currency.format(p.raised)} of {currency.format(p.goal)}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cream-deep"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${p.name} funding progress`}
                  >
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-sm text-ink-muted">
            Admin and hosting for Brave Homes are paid for separately, never from
            donations. That is the whole promise.
          </p>
        </section>
      </div>
    </>
  );
}
