'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessionUser } from './PortalShell';
import { Notice } from '@/components/ui/Field';
import { DonateCheckout } from './DonateCheckout';
import { getMyGivingHistory, recordPledge, type GivingRecord } from '@/lib/db';
import { currency, donationTiers, impactFor } from '@/lib/content';
import { GiveCanvas } from '@/components/three';

/** This page leaves the portal's yellow behind: the photograph sets the
    palette — slate sky, white linen — and the one accent is a soft lime. */
const LIME = '#d7f05c';
const SLATE = '#2b3a4a';

/** "Bedding and warm blankets for a new room." → "bedding and warm blankets for a new room" */
function asClause(sentence: string) {
  const trimmed = sentence.replace(/\.$/, '');
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export function DonateClient() {
  const me = useSessionUser();
  const params = useSearchParams();
  const router = useRouter();

  const amountParam = Number.parseFloat(params.get('amount') ?? '');
  const initialAmount = Number.isFinite(amountParam) && amountParam > 0 ? amountParam : 20;

  const [amount, setAmount] = useState<number>(initialAmount);
  // A carried-over amount that isn't one of the tiers belongs in the
  // custom field, or the tier buttons would all read as unselected.
  const [custom, setCustom] = useState(() =>
    donationTiers.includes(initialAmount as never) ? '' : String(initialAmount),
  );

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    params.get('cancelled')
      ? 'No payment was taken. You can try again whenever you are ready.'
      : null,
  );
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [checkout, setCheckout] = useState<{ amount: number; clientSecret: string } | null>(
    null,
  );

  // The payment step is meant to feel like the one thing on the page —
  // scrolling past it to the amount picker mid-payment is confusing, not
  // convenient. The card form itself can still scroll internally.
  //
  // On narrow screens the checkout pane sits *above* the ask panel in
  // the page, but the button that opens it lives down inside the ask
  // panel — so the page is usually scrolled well past the top when this
  // fires. Locking scroll without first snapping back to the top would
  // strand someone looking at a greyed-out form with the actual payment
  // card invisible above them.
  useEffect(() => {
    if (!checkout) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [checkout]);

  const impact = useMemo(() => impactFor(amount), [amount]);
  const valid = amount > 0;

  /* Every gift this person has actually made, confirmed by Stripe — one
     fetch feeds both the little badge near the ask and the full history
     card further down, so the two can never disagree with each other. */
  const [giving, setGiving] = useState<GivingRecord[] | null>(null);
  useEffect(() => {
    let alive = true;
    void getMyGivingHistory(me.id).then((g) => {
      if (alive) setGiving(g);
    });
    return () => {
      alive = false;
    };
  }, [me.id]);
  /**
   * The dashboard's "Your giving" row links here with #giving, but the
   * history section only exists once it has loaded — the browser's own
   * jump-to-anchor fires on navigation, before that fetch resolves, and
   * finds nothing there yet. Once it does resolve, do the jump ourselves.
   */
  useEffect(() => {
    if (giving && window.location.hash === '#giving') {
      document.getElementById('giving')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [giving]);

  /* The chips lean a few pixels toward the pointer, like the sign-in
     page — same physics, same feel, one product. */
  const photoPane = useRef<HTMLDivElement>(null);
  const chipLayer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = photoPane.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (chipLayer.current)
        chipLayer.current.style.transform = `translate3d(${cx * 10}px, ${cy * 8}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

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

  /**
   * Starts the payment.
   *
   * The amount is sent, not the price: the server re-checks it and writes
   * the pledge row before a card is ever charged. What comes back is a
   * PaymentIntent's client secret, which opens the card form right here
   * on the page rather than sending the giver off to a page that looks
   * like Stripe's rather than Brave Homes'. If the keys aren't set yet
   * the route says so with a 503, and we fall back to recording the
   * pledge so the promise to give isn't simply lost.
   */
  async function onPledge() {
    if (!valid || busy || checkout) return;
    setBusy(true);
    setNotice(null);
    setSetupNeeded(false);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const { clientSecret } = (await response.json()) as { clientSecret?: string };
        if (clientSecret) {
          setBusy(false);
          setCheckout({ amount, clientSecret });
          return;
        }
      }

      if (response.status !== 503) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setBusy(false);
        setNotice(error ?? 'Something went wrong starting the payment.');
        return;
      }
    } catch {
      setBusy(false);
      setNotice('We could not reach the payment page. Please check your connection.');
      return;
    }

    // 503: Stripe isn't connected. Record the intent instead.
    const result = await recordPledge(me.id, amount, 'general');
    setBusy(false);

    if (result.ok) {
      setNotice(
        `Thank you. Your pledge of ${currency.format(amount)} is recorded. Card payment isn’t switched on yet — the team will be in touch to complete it.`,
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
    <div className="lg:-mb-6">
      {/* The same two-panel composition as the sign-in page — the ask on
          a warm ground, the photograph unveiling beside it — so the whole
          product reads as one hand's work. */}
      <div className="grid min-h-[calc(100svh-5.25rem)] lg:grid-cols-[0.95fr_1.05fr]">
        {/* ------------------------------ the ask ------------------------------ */}
        <div
          className="bg-breathe panel-in-left flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14"
          style={{
            background:
              'linear-gradient(155deg, #f5f3ef 0%, #f3efe6 40%, #f4e8c9 75%, #f5dfa8 100%)',
          }}
        >
          <div className="mx-auto w-full max-w-lg">
            <p className="rise-in text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/55">
              Your gift
            </p>

            <h1
              className="rise-in mt-3 text-4xl font-medium leading-[1.05] tracking-tight text-[#1a1a1a] sm:text-5xl"
              style={{ animationDelay: '100ms' }}
            >
              Take their{' '}
              <span className="own-line">
                hand.
                <svg
                  className="own-underline"
                  viewBox="0 0 320 24"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 16 Q 84 7 162 13 T 312 11"
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p
              aria-live="polite"
              className="rise-in mt-4 text-lg leading-snug text-[#1a1a1a]/70"
              style={{ animationDelay: '200ms' }}
            >
              {valid ? (
                <>
                  {currency.format(amount)} goes towards{' '}
                  <strong key={impact} className="swap-in inline-block font-semibold text-[#1a1a1a]">
                    {asClause(impact)}
                  </strong>
                  .
                </>
              ) : (
                <>Every gift goes towards someone’s care.</>
              )}
            </p>

            <div
              className="rise-in mt-8 flex flex-wrap gap-2.5"
              style={{ animationDelay: '300ms' }}
            >
              {donationTiers.map((tier) => {
                const active = amount === tier && custom === '';
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => chooseTier(tier)}
                    disabled={Boolean(checkout)}
                    aria-pressed={active}
                    className={`press min-h-[var(--bh-tap)] rounded-full px-6 text-lg font-bold transition-all disabled:opacity-40 sm:px-7 ${
                      active
                        ? 'scale-[1.06] bg-[#1a1a1a] text-white shadow-[0_14px_28px_-16px_rgba(26,26,26,0.6)]'
                        : 'bg-white/80 text-[#1a1a1a] hover:bg-white'
                    }`}
                  >
                    £{tier}
                  </button>
                );
              })}
            </div>

            <label className="rise-in mt-3 block" style={{ animationDelay: '380ms' }}>
              <span className="sr-only">Or enter your own amount in pounds</span>
              <div
                className={`field-shell flex items-center gap-2 rounded-full border-2 bg-white px-6 transition-colors ${
                  custom !== ''
                    ? 'border-[#1a1a1a]'
                    : 'border-transparent focus-within:border-[#1a1a1a]/30'
                }`}
              >
                <span className="text-lg font-bold text-[#1a1a1a]/40" aria-hidden="true">
                  £
                </span>
                <input
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => onCustom(e.target.value)}
                  disabled={Boolean(checkout)}
                  placeholder="Your own amount"
                  className="min-h-[var(--bh-tap)] w-full bg-transparent text-lg text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 disabled:opacity-40"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={() => void onPledge()}
              disabled={!valid || busy || Boolean(checkout)}
              className="cta-sheen press rise-in mt-6 flex min-h-14 w-full items-center justify-center rounded-full text-lg font-bold text-[#1a1a1a] transition-all disabled:opacity-40"
              style={{ background: '#f5d64e', animationDelay: '460ms' }}
            >
              {busy ? (
                <span>
                  One moment
                  <span className="dot-bounce">.</span>
                  <span className="dot-bounce">.</span>
                  <span className="dot-bounce">.</span>
                </span>
              ) : (
                <span key={amount} className="swap-in inline-block">
                  Give {currency.format(amount || 0)}
                </span>
              )}
            </button>

            <p
              className="rise-in mt-4 text-center text-sm font-semibold text-[#1a1a1a]/60"
              style={{ animationDelay: '540ms' }}
            >
              Every penny reaches the cause. None of it pays a salary, an
              office, or this website. Ever.
            </p>

            {notice && (
              <p
                role="status"
                className="pop-in mt-4 rounded-2xl border border-[#f5d64e] bg-[#f5d64e]/25 px-4 py-3 text-sm font-medium text-[#1a1a1a]"
              >
                {notice}
              </p>
            )}

            {/* Your own receipts, right here in the ask itself — not a
                table waiting a full screen further down. A jar of little
                stamped gifts feels like keepsakes, not a spreadsheet. */}
            {giving && (
              <div
                id="giving"
                className="rise-in scroll-mt-24 mt-7 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-5"
                style={{ animationDelay: '600ms' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/55">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] text-[#1a1a1a]"
                      style={{ background: '#f5d64e' }}
                      aria-hidden="true"
                    >
                      ♥
                    </span>
                    Your giving
                  </h2>
                  {giving.length > 0 && (
                    <span className="text-lg font-bold text-[#1a1a1a]">
                      {currency.format(
                        giving
                          .filter((g) => g.status === 'paid')
                          .reduce((sum, g) => sum + g.amount - g.refunded_amount, 0),
                      )}
                    </span>
                  )}
                </div>

                {giving.length > 0 ? (
                  <>
                    {/* Refunded gifts stay in the list — a receipt that
                        quietly vanished would read as a bug, not as "we
                        gave your money back." A full refund is struck
                        through; a partial one keeps its amount (some of
                        it genuinely arrived) with what came back noted
                        beside it. Neither counts toward the total above
                        for more than what's actually left. */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {giving.slice(0, 6).map((g) => {
                        const refunded = g.status === 'refunded';
                        const partial = !refunded && g.refunded_amount > 0;
                        return (
                          <span
                            key={g.id}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              refunded
                                ? 'bg-[#1a1a1a]/[0.03] text-[#1a1a1a]/45'
                                : 'bg-[#1a1a1a]/[0.05] text-[#1a1a1a]'
                            }`}
                          >
                            <span className={refunded ? 'line-through' : ''}>
                              {currency.format(g.amount)}
                            </span>
                            <span className={refunded ? '' : 'font-normal text-[#1a1a1a]/45'}>
                              ·{' '}
                              {new Date(g.paid_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            {refunded && (
                              <span className="rounded-full bg-[#1a1a1a]/[0.06] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#1a1a1a]/50">
                                Refunded
                              </span>
                            )}
                            {partial && (
                              <span className="rounded-full bg-[#1a1a1a]/[0.06] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#1a1a1a]/50">
                                {currency.format(g.refunded_amount)} refunded
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {giving.length > 6 && (
                      <p className="mt-2.5 text-xs text-[#1a1a1a]/45">
                        +{giving.length - 6} more, going back to your first gift.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[#1a1a1a]/55">
                    Nothing yet — your first gift will show up right here.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------- the reach -----------------------------
            Giving takes over this same pane rather than opening a dialog
            on top of everything — the hands wait; the card form is what
            you actually came here to do. */}
        <div
          className={`relative order-first lg:order-none ${
            checkout ? 'h-[calc(100svh-5.25rem)]' : 'h-[44svh] lg:h-auto'
          }`}
        >
          {checkout && (
            <DonateCheckout
              amount={checkout.amount}
              clientSecret={checkout.clientSecret}
              onClose={() => setCheckout(null)}
              onSuccess={(paymentIntentId) => {
                router.push(`/portal/donate/thanks?payment_intent=${paymentIntentId}`);
              }}
            />
          )}

          <div
            ref={photoPane}
            className={`photo-unveil relative h-full overflow-hidden ${checkout ? 'hidden' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/donate-hands.jpg"
              alt=""
              className="kenburns-in absolute inset-0 h-full w-full object-cover"
            />
            {/* Warmed, not slated — the same light as the rest of the site. */}
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{ background: 'rgba(190,150,70,0.14)' }}
            />

            {/* The floating heart's position is tuned for the tall
                desktop panel, where it hangs just above the fingertips —
                squeezed into the much shorter mobile strip it lands
                nowhere near the hands and reads as a stray glitch, so
                phones get the plain photo instead. */}
            <GiveCanvas className="pointer-events-none absolute inset-0 hidden lg:block" />

            <div className="sun-sweep" aria-hidden="true" />

            <div ref={chipLayer} className="pointer-events-none absolute inset-0">
            {/* The promise, floating where the hands are about to meet.
                On mobile the strip is too short for two chips without
                them crowding each other and the hands underneath — the
                same "every penny" promise already sits in the ask
                panel's text, so this one is desktop-only. */}
            <div
              className="pop-in absolute right-6 top-8 hidden lg:block lg:right-10 lg:top-12"
              style={{ animationDelay: '1100ms' }}
              aria-hidden="true"
            >
              <div
                className="bob flex items-center gap-2.5 rounded-full bg-white/90 px-5 py-3 shadow-[0_18px_40px_-22px_rgba(26,26,26,0.45)] backdrop-blur-sm"
                style={{ '--dur': '6s', '--tilt': '1.2deg' } as React.CSSProperties}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#f5d64e' }} />
                <span className="text-sm font-bold text-[#1a1a1a]">100% to the cause</span>
              </div>
            </div>

            <div
              className="pop-in absolute bottom-5 left-4 right-4 lg:bottom-14 lg:left-10 lg:right-auto"
              style={{ animationDelay: '1350ms' }}
              aria-hidden="true"
            >
              <div
                className="bob flex items-center gap-3 rounded-2xl bg-white/90 py-3 pl-3 pr-5 shadow-[0_18px_40px_-22px_rgba(26,26,26,0.45)] backdrop-blur-sm lg:inline-flex"
                style={{ '--dur': '5s', '--tilt': '-1.2deg' } as React.CSSProperties}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ background: '#f5d64e' }}
                >
                  ♥
                </span>
                <span key={`${amount}-${impact}`} className="swap-in min-w-0">
                  <span className="block text-sm font-bold text-[#1a1a1a]">
                    {valid ? currency.format(amount) : 'Any amount'}
                  </span>
                  <span className="block truncate text-xs leading-snug text-[#1a1a1a]/60 lg:max-w-60 lg:whitespace-normal">
                    {asClause(impact)}
                  </span>
                </span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {setupNeeded && (
        <div className="px-5 py-4 sm:px-8">
          <Notice tone="error">
            Pledges can’t be saved yet — the <code>pledges</code> table doesn’t
            exist in Supabase. Run <code>0002_pledges.sql</code> and this will
            start working.
          </Notice>
        </div>
      )}
    </div>
  );
}
