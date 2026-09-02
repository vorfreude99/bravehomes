'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Waits for the webhook to catch up.
 *
 * Stripe redirects the customer back the instant the payment is
 * submitted, which can beat the webhook that marks the pledge paid by a
 * second or two. Rather than leave someone staring at "still being
 * confirmed", this re-fetches the page a few times and then stops — it
 * never spins for ever, because a payment that hasn't landed in fifteen
 * seconds needs a person, not another poll.
 */
export function AwaitPayment() {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (tries > 5) {
        window.clearInterval(id);
        return;
      }
      router.refresh();
    }, 2500);

    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
