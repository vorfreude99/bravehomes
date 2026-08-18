'use client';

import { useMemo, useState } from 'react';
import { BrickCanvas, bricksFor, POUNDS_PER_BRICK } from '@/components/three';
import { Button, LinkButton } from '@/components/ui/Button';
import { currency, donationTiers, impactFor, projects } from '@/lib/content';

type Props = {
  /**
   * 'teaser' sends the visitor on to the portal to finish.
   * 'full' is the signed-in flow that records the pledge.
   */
  mode?: 'teaser' | 'full';
  onPledge?: (amount: number, projectId: string) => Promise<void> | void;
  busy?: boolean;
  notice?: string | null;
  /** Carried over from the landing page so the choice isn't lost. */
  initialAmount?: number;
  initialProjectId?: string;
};

export function DonateWidget({
  mode = 'teaser',
  onPledge,
  busy,
  notice,
  initialAmount,
  initialProjectId,
}: Props) {
  const [amount, setAmount] = useState<number>(
    initialAmount && initialAmount > 0 ? initialAmount : 20,
  );
  // A carried-over amount that isn't one of the tiers belongs in the
  // custom field, or the tier buttons would all read as unselected.
  const [custom, setCustom] = useState(() =>
    initialAmount && initialAmount > 0 && !donationTiers.includes(initialAmount as never)
      ? String(initialAmount)
      : '',
  );
  const [projectId, setProjectId] = useState(
    projects.some((p) => p.id === initialProjectId)
      ? (initialProjectId as string)
      : projects[0].id,
  );

  const bricks = bricksFor(amount);
  const impact = useMemo(() => impactFor(amount), [amount]);

  const chooseTier = (value: number) => {
    setAmount(value);
    setCustom('');
  };

  const onCustom = (raw: string) => {
    // Digits and a single decimal point only — no currency symbols to fight.
    const cleaned = raw.replace(/[^0-9.]/g, '');
    setCustom(cleaned);
    const parsed = Number.parseFloat(cleaned);
    setAmount(Number.isFinite(parsed) ? parsed : 0);
  };

  const valid = amount > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      {/* ------------------------------ controls ------------------------------ */}
      <div>
        <fieldset>
          <legend className="sr-only">Choose an amount to give</legend>
          <div className="grid grid-cols-2 gap-3">
            {donationTiers.map((tier) => {
              const active = amount === tier && custom === '';
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => chooseTier(tier)}
                  aria-pressed={active}
                  className={`min-h-[var(--bh-tap)] rounded-2xl border-2 py-4 text-xl font-bold transition-all ${
                    active
                      ? 'border-sage bg-sage-mist/70 text-forest shadow-[0_10px_30px_-16px_rgba(47,58,35,0.6)]'
                      : 'border-sage/30 bg-parchment text-olive hover:border-sage hover:bg-cream-deep/60'
                  }`}
                >
                  £{tier}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="sr-only">Or enter your own amount in pounds</span>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-sage/30 bg-parchment px-5 focus-within:border-sage">
            <span className="text-xl font-bold text-ink-muted" aria-hidden="true">
              £
            </span>
            <input
              inputMode="decimal"
              value={custom}
              onChange={(e) => onCustom(e.target.value)}
              placeholder="Or enter your own amount…"
              className="min-h-[var(--bh-tap)] w-full bg-transparent text-lg text-forest outline-none placeholder:text-ink-muted/70"
            />
          </div>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-olive">
            Where should it go?
          </span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="min-h-[var(--bh-tap)] w-full rounded-2xl border-2 border-sage/30 bg-parchment px-4 text-base text-forest outline-none focus:border-sage"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6">
          {mode === 'teaser' ? (
            <LinkButton
              href={`/portal/donate?amount=${valid ? amount : 20}&project=${projectId}`}
              variant="gold"
              size="lg"
              className="w-full"
            >
              Donate now
            </LinkButton>
          ) : (
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={!valid || busy}
              onClick={() => onPledge?.(amount, projectId)}
            >
              {busy ? 'Saving…' : `Give ${currency.format(amount || 0)}`}
            </Button>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-sage">
          <span aria-hidden="true">✓</span>
          100% directly to the cause. Zero admin fees. Always.
        </p>

        {notice && (
          <p
            role="status"
            className="mt-4 rounded-2xl border border-gold/50 bg-gold-soft/25 px-4 py-3 text-sm text-forest"
          >
            {notice}
          </p>
        )}
      </div>

      {/* -------------------------------- wall -------------------------------- */}
      <div>
        <BrickCanvas amount={amount} className="h-[22rem] w-full" />

        <div className="card-solid mt-4 p-5 text-center">
          <p className="font-serif text-2xl font-medium text-forest">
            {currency.format(amount || 0)} lays{' '}
            <span className="text-gold-ink">{bricks}</span>{' '}
            {bricks === 1 ? 'brick' : 'bricks'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{impact}</p>
          <p className="mt-3 text-xs text-ink-muted/80">
            One brick ≈ £{POUNDS_PER_BRICK} of materials and labour.
          </p>
        </div>
      </div>
    </div>
  );
}
