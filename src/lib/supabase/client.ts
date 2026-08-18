'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = url.startsWith('http') && key.length > 20;

/** Browser-side Supabase client. Cached so realtime channels are shared. */
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!cached) cached = createBrowserClient(url, key);
  return cached;
}
