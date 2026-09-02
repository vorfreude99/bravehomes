import 'server-only';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Stripe and Supabase helpers.
 *
 * Everything here needs a secret, so nothing in this file may ever be
 * imported from a client component — `server-only` makes that a build
 * error rather than a leak nobody notices.
 */

/** True once the keys are set, so the UI can say what is missing. */
export function paymentsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

/**
 * A Supabase client with the service-role key.
 *
 * Used only by the webhook. It bypasses row-level security, which is
 * exactly why `pledges` has no update policy for ordinary users: marking
 * a pledge paid has to come from Stripe, not from a browser.
 */
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service-role credentials are not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Donations are in pounds; Stripe counts pence. */
export const toPence = (pounds: number) => Math.round(pounds * 100);
