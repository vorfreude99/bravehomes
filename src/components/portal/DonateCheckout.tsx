'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { Notice } from '@/components/ui/Field';
import { currency } from '@/lib/content';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Matches the donate page's own palette and type rather than Stripe's
 * defaults — the card fields still live in Stripe's sandboxed iframes
 * (required for PCI compliance), but themed closely enough that the
 * seam barely shows.
 */
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1a1a1a',
    colorBackground: '#ffffff',
    colorText: '#1a1a1a',
    colorTextSecondary: 'rgba(26,26,26,0.55)',
    colorDanger: '#b3402f',
    fontFamily: '"Public Sans", system-ui, sans-serif',
    borderRadius: '14px',
    spacingUnit: '4px',
  },
  rules: {
    '.Label': { fontWeight: '600', fontSize: '0.8rem' },
    '.Input': {
      border: '1.5px solid rgba(26,26,26,0.12)',
      boxShadow: 'none',
      padding: '12px 14px',
    },
    '.Input:focus': {
      border: '1.5px solid #1a1a1a',
      boxShadow: 'none',
    },
    '.Tab': {
      border: '1.5px solid rgba(26,26,26,0.1)',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      border: '1.5px solid #1a1a1a',
      boxShadow: 'none',
    },
  },
};

function CheckoutForm({
  amount,
  onSuccess,
}: {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        // Only card methods that truly need a full page (bank redirects)
        // ever leave this page — everything else, including a 3-D Secure
        // challenge, happens in place.
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/portal/donate/thanks`,
        },
      });

      if (confirmError) {
        setError(confirmError.message ?? 'That payment did not go through. Please try again.');
        return;
      }

      if (paymentIntent) onSuccess(paymentIntent.id);
    } catch {
      // confirmPayment normally resolves with {error} rather than
      // rejecting, but a genuine network failure can still throw — left
      // uncaught, `submitting` would stay stuck `true` forever with no
      // way to retry short of reloading the page.
      setError('We could not reach the payment network. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="cta-sheen press mt-6 flex min-h-14 w-full items-center justify-center rounded-full text-lg font-bold text-[#1a1a1a] transition-all disabled:opacity-40"
        style={{ background: '#f5d64e' }}
      >
        {submitting ? (
          <span>
            One moment
            <span className="dot-bounce">.</span>
            <span className="dot-bounce">.</span>
            <span className="dot-bounce">.</span>
          </span>
        ) : (
          `Give ${currency.format(amount)}`
        )}
      </button>

    </form>
  );
}

/**
 * The card form itself, in the site's own card — not a redirect to a
 * page branded for Stripe. `clientSecret` comes from a PaymentIntent
 * `/api/checkout` already created and tied to a pledge row, so this
 * component only ever has to collect and confirm payment details.
 *
 * Fills whatever pane it's placed in — on the donate page that's the
 * photograph's own spot, so giving *replaces* the picture of the two
 * hands reaching for each other rather than floating a dialog over it.
 */
export function DonateCheckout({
  amount,
  clientSecret,
  onClose,
  onSuccess,
}: {
  amount: number;
  clientSecret: string;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
}) {
  return (
    <div
      className="pop-in relative h-full w-full overflow-hidden"
      role="region"
      aria-label="Complete your donation"
    >
      {/* An abstract amber-glass backdrop — sharp, not softened, so it
          reads as a real piece of art behind the card rather than a blur
          standing in for one. Pinned in place, not inside the scrollable
          layer below, so it never shifts or leaves a gap while the card
          scrolls. Photo: Al Amin Mir, Unsplash. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/donate-checkout-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* A light wash, so the card and the back button stay legible
          without dulling the glass and the light in the photograph. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(175deg, rgba(20,12,4,0.4) 0%, rgba(20,12,4,0.12) 30%, rgba(20,12,4,0.12) 70%, rgba(20,12,4,0.5) 100%)',
        }}
      />
      {/* A vignette, so the card itself stays the brightest thing on the
          panel rather than competing with the photograph behind it. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(0,0,0,0) 35%, rgba(20,12,4,0.5) 100%)',
        }}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Back to the photograph"
        title="Back"
        className="press absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-7 sm:top-7"
      >
        <span aria-hidden="true">←</span>
      </button>

      {/* The scrollable layer. Deliberately a plain block, not a flex
          container with its own overflow — centering and scrolling on the
          same element is a well-known trap where browsers clip whatever
          doesn't fit instead of letting you scroll to it. The centering
          flex lives one level in, on a child, where that bug doesn't
          apply. */}
      <div className="no-bar absolute inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center px-5 py-10 sm:px-8">
          {!stripePromise ? (
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
              <Notice tone="error">
                Payments aren’t fully set up yet — the site is missing its
                Stripe publishable key.
              </Notice>
            </div>
          ) : (
            <div className="w-full max-w-md rounded-[2rem] bg-[#faf8f4] p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: '#f5d64e' }}
                  aria-hidden="true"
                >
                  ♥
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
                  Your gift to Brave Homes
                </p>
              </div>
              <p className="mt-2 text-4xl font-medium tracking-tight text-[#1a1a1a]">
                {currency.format(amount)}
              </p>

              <div className="mt-6 border-t border-[#1a1a1a]/[0.07] pt-6">
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance,
                    fonts: [
                      {
                        cssSrc:
                          'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap',
                      },
                    ],
                  }}
                >
                  <CheckoutForm amount={amount} onSuccess={onSuccess} />
                </Elements>
              </div>

              <p className="mt-5 text-center text-xs text-[#1a1a1a]/40">
                Payments handled securely by Stripe. Brave Homes never sees
                or stores your card details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
