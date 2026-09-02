-- Stripe
--
-- Run after 0002. Pledges gain the fields a payment needs, and only a
-- server-side key may move `status` — the client can create an intent
-- and nothing more.

alter table public.pledges
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists currency text not null default 'gbp',
  add column if not exists paid_at timestamptz;

create unique index if not exists pledges_session_idx
  on public.pledges (stripe_session_id)
  where stripe_session_id is not null;

-- Deliberately still no update or delete policy for `authenticated`.
-- The webhook writes with the service-role key, which bypasses RLS, so
-- nobody can mark their own pledge paid from the browser.
