'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, LinkButton } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Field';
import { DonateCheckout } from '@/components/portal/DonateCheckout';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { currency } from '@/lib/content';

const PRESETS = [10, 25, 50, 100];

/**
 * The giving half of an appeal page: live progress, an amount, a card
 * form, a thank-you. Giving is for signed-in members — a visitor sees
 * the appeal and the progress, and is walked to sign-in first, coming
 * straight back here afterwards.
 */
export function CampaignClient({ campaignId, goal }: { campaignId: string; goal: number }) {
  const [raised, setRaised] = useState<number | null>(null);
  const [supporters, setSupporters] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [selected, setSelected] = useState<number | null>(25);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ amount: number; clientSecret: string } | null>(null);
  const [done, setDone] = useState(false);

  const amount = custom ? Number(custom) : (selected ?? 0);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSignedIn(false);
      return;
    }
    createClient()
      .auth.getUser()
      .then((res: { data: { user: unknown } }) => setSignedIn(Boolean(res.data.user)))
      .catch(() => setSignedIn(false));
  }, []);

  async function loadProgress() {
    try {
      const res = await fetch(`/api/campaign/${campaignId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { raised?: number; supporters?: number };
      if (typeof data.raised === 'number') setRaised(data.raised);
      if (typeof data.supporters === 'number') setSupporters(data.supporters);
    } catch {
      // The appeal still reads fine without a live number.
    }
  }

  useEffect(() => {
    void loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function start() {
    setError(null);
    if (!Number.isFinite(amount) || amount < 1) {
      setError('Choose an amount first — every pound genuinely helps.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/campaign-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, campaignId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        clientSecret?: string;
        error?: string;
      };
      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setCheckout({ amount, clientSecret: data.clientSecret });
    } catch {
      setError('We could not reach the payment network. Please check your connection.');
    } finally {
      setBusy(false);
    }
  }

  const pct =
    raised == null ? 0 : Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));

  if (done) {
    return (
      <div className="card-solid mt-10 p-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          💛
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium text-forest">Thank you.</h2>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-olive">
          Your gift is on its way to Meadow Banks — every penny of it.
          When the furniture arrives and the memory boxes are filled,
          this page is where we’ll show it.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* ------------------------------ progress ----------------------------- */}
      {/* Steps aside while the card form is open, so paying happens in
          this same space with nothing pushing it below the fold. */}
      {!checkout && (
      <div className="card-solid p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-serif text-3xl font-medium text-forest">
            {raised == null ? '—' : currency.format(raised)}
            <span className="ml-2 text-base font-normal text-olive">
              raised of {currency.format(goal)}
            </span>
          </p>
          <p className="text-sm font-semibold text-sage-ink">
            {raised != null && `${pct}% funded`}
            {supporters > 0 &&
              ` · ${supporters} ${supporters === 1 ? 'supporter' : 'supporters'}`}
          </p>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-sage-mist"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Appeal progress"
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      )}

      {/* ------------------------------- give -------------------------------- */}
      {/* The card form appears only once the session is confirmed — until
          then (loading, or signed out) the page asks for sign-in, so a
          visitor never sees a give form they can't actually use. The API
          enforces the same rule server-side regardless. */}
      {signedIn !== true ? (
        <div className="card-solid mt-6 p-6 text-center sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-ink">
            Give to this appeal
          </p>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-olive">
            Giving is for Brave Homes members — it keeps every donation
            attached to a real, verified person. Sign in and you’ll come
            straight back here.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
            <LinkButton
              href={`/login?next=/campaign/${campaignId}`}
              variant="gold"
              size="lg"
              className="cta-sheen w-full"
            >
              Sign in to give
            </LinkButton>
            <Link
              href="/signup"
              className="press flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full border-2 border-sage/40 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60"
            >
              New here? Join free
            </Link>
          </div>
        </div>
      ) : checkout ? (
        <div className="mt-6 h-[600px] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-24px_rgba(47,58,35,0.5)]">
          <DonateCheckout
            amount={checkout.amount}
            clientSecret={checkout.clientSecret}
            returnPath={`/campaign/${campaignId}/thanks`}
            onClose={() => setCheckout(null)}
            onSuccess={() => {
              setDone(true);
              void loadProgress();
            }}
          />
        </div>
      ) : (
        <div className="card-solid mt-6 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-ink">
            Give to this appeal
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {PRESETS.map((value) => {
              const active = !custom && selected === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelected(value);
                    setCustom('');
                  }}
                  aria-pressed={active}
                  className={`press min-h-[var(--bh-tap)] rounded-2xl border-2 font-bold transition-colors ${
                    active
                      ? 'border-forest bg-forest text-cream'
                      : 'border-sage/40 text-forest hover:border-forest'
                  }`}
                >
                  £{value}
                </button>
              );
            })}
          </div>

          <label className="mt-3 block">
            <span className="sr-only">A different amount, in pounds</span>
            <input
              inputMode="numeric"
              placeholder="Or type another amount (£)"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              className="w-full rounded-2xl border-2 border-sage/40 bg-white px-4 py-3 font-semibold text-forest placeholder:font-normal placeholder:text-ink-muted focus:border-forest focus:outline-none"
            />
          </label>

          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <Button
            onClick={() => void start()}
            disabled={busy}
            variant="gold"
            size="lg"
            className="cta-sheen press mt-5 w-full"
          >
            {busy
              ? 'One moment…'
              : `Give ${Number.isFinite(amount) && amount > 0 ? currency.format(amount) : ''}`}
          </Button>

          <p className="mt-4 text-center text-xs text-ink-muted">
            Payments handled securely by Stripe. Your receipt goes to
            your account email, and 100% of every donation reaches the
            appeal — nothing is kept for costs.
          </p>
        </div>
      )}
    </div>
  );
}
