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
  variant = 'bar',
}: {
  campaignId: string;
  goal: number;
  tone?: 'site' | 'dashboard';
  variant?: 'bar' | 'ring';
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

  if (variant === 'ring') {
    const R = 40;
    const C = 2 * Math.PI * R;
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative flex h-[104px] w-[104px] items-center justify-center"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Appeal progress"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={dark ? 'rgba(26,26,26,0.1)' : 'rgba(255,255,255,0.75)'}
              strokeWidth="9"
            />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={dark ? '#f5d64e' : 'var(--color-gold)'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 700ms ease' }}
            />
          </svg>
          <span
            className={`absolute font-serif text-2xl font-medium ${dark ? 'text-[#1a1a1a]' : 'text-forest'}`}
          >
            {pct}%
          </span>
        </div>
        <p className={`mt-2 text-xs font-semibold ${dark ? 'text-[#1a1a1a]/70' : 'text-sage-ink'}`}>
          {currency.format(raised)} of {currency.format(goal)}
        </p>
      </div>
    );
  }

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
