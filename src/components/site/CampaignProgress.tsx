'use client';

import { useEffect, useState } from 'react';
import { currency } from '@/lib/content';

/**
 * A one-line live tracker for an appeal: pounds raised, percentage,
 * and a slim bar. Fetches the same aggregate the appeal page uses, so
 * every surface shows the same truth. Two palettes: 'site' for the
 * public pages, 'dashboard' for the portal's ink-on-paper tiles.
 */
export function CampaignProgress({
  campaignId,
  goal,
  tone = 'site',
}: {
  campaignId: string;
  goal: number;
  tone?: 'site' | 'dashboard';
}) {
  const [raised, setRaised] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/campaign/${campaignId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { raised?: number } | null) => {
        if (alive && data && typeof data.raised === 'number') setRaised(data.raised);
      })
      .catch(() => {
        // The tracker is decoration on these surfaces — the appeal page
        // is the authority. Show nothing rather than something wrong.
      });
    return () => {
      alive = false;
    };
  }, [campaignId]);

  if (raised == null) return null;

  const pct = Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
  const dark = tone === 'dashboard';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-sm font-semibold ${dark ? 'text-[#1a1a1a]' : 'text-forest'}`}>
          {currency.format(raised)}
          <span className={dark ? 'font-normal text-[#1a1a1a]/60' : 'font-normal text-olive'}>
            {' '}
            of {currency.format(goal)}
          </span>
        </p>
        <p className={`text-xs font-bold ${dark ? 'text-[#1a1a1a]/70' : 'text-sage-ink'}`}>
          {pct}%
        </p>
      </div>
      <div
        className={`mt-1.5 h-2 overflow-hidden rounded-full ${dark ? 'bg-[#1a1a1a]/10' : 'bg-white/70'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Appeal progress"
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: dark ? '#f5d64e' : 'var(--color-gold)' }}
        />
      </div>
    </div>
  );
}
