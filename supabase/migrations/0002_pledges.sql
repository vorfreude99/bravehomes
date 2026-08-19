-- Pledges
--
-- Run after 0000. This is the table `recordPledge` writes to.
--
-- IMPORTANT: a row here is an *intention to give*, not a payment. No
-- money moves until Stripe is wired up, and the UI says so. `status`
-- exists so that wiring has somewhere to land rather than needing a
-- migration mid-flight.

create table if not exists public.pledges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      integer not null check (amount > 0),
  project_id  text not null,
  status      text not null default 'intent'
                check (status in ('intent', 'paid', 'failed', 'refunded')),
  created_at  timestamptz not null default now()
);

create index if not exists pledges_user_idx on public.pledges (user_id);

alter table public.pledges enable row level security;

-- You can see and add your own. Totals shown on the site come from
-- `content.ts`, not from this table, so nothing here is public.
drop policy if exists "read own pledges" on public.pledges;
create policy "read own pledges"
  on public.pledges for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pledge as self" on public.pledges;
create policy "pledge as self"
  on public.pledges for insert to authenticated
  with check (auth.uid() = user_id);

-- Deliberately no update or delete policy: once Stripe is confirming
-- payments, only a server-side key should be moving `status`.
