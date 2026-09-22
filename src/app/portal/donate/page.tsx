import { redirect } from 'next/navigation';

/**
 * There is no general donate page any more — all giving goes to the
 * live appeal, so every old link and bookmark lands there too. The
 * /thanks route below survives for Stripe's bank-redirect returns.
 */
export default function DonatePage() {
  redirect('/campaign/meadow-banks');
}
