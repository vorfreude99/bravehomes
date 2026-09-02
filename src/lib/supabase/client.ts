'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = url.startsWith('http') && key.length > 20;

/**
 * A signup that hangs server-side (GoTrue sending the confirmation email
 * synchronously against a slow or misconfigured SMTP server, say) used to
 * leave the caller waiting forever — no error, no way out, just a spinner.
 * Every request now gives up after 20s so the caller's own `catch` can
 * show an error instead.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(20000) });
}

/** Browser-side Supabase client. Cached so realtime channels are shared. */
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!cached) cached = createBrowserClient(url, key, { global: { fetch: fetchWithTimeout } });
  return cached;
}
