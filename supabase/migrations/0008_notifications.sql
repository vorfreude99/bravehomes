-- Notifications: unread messages + missed calls
--
-- Run after 0007. Two things:
--
-- 1. `messages.read_at` — set when the recipient actually opens that
--    conversation, so a real "you have unread messages" count is
--    possible instead of guessing from timestamps on the client.
--
-- 2. `public.calls` — a call has no other record of itself: the
--    signalling in `calls:${userId}` is a live broadcast, gone the
--    instant nobody is listening. If someone is called while their
--    browser is closed, their own client never runs to note it down —
--    so the *caller's* client logs the outcome instead, since it is
--    the side guaranteed to be there to see the call go unanswered.

alter table public.messages
  add column if not exists read_at timestamptz;

drop policy if exists "mark received read" on public.messages;
create policy "mark received read"
  on public.messages for update to authenticated
  using (auth.uid() = recipient)
  with check (auth.uid() = recipient);

create table if not exists public.calls (
  id          uuid primary key default gen_random_uuid(),
  caller_id   uuid not null references auth.users (id) on delete cascade,
  callee_id   uuid not null references auth.users (id) on delete cascade,
  status      text not null check (status in ('missed', 'declined')),
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);

create index if not exists calls_callee_idx on public.calls (callee_id);

alter table public.calls enable row level security;

drop policy if exists "log own calls" on public.calls;
create policy "log own calls"
  on public.calls for insert to authenticated
  with check (auth.uid() = caller_id);

drop policy if exists "read own calls" on public.calls;
create policy "read own calls"
  on public.calls for select to authenticated
  using (auth.uid() = caller_id or auth.uid() = callee_id);

drop policy if exists "mark own calls seen" on public.calls;
create policy "mark own calls seen"
  on public.calls for update to authenticated
  using (auth.uid() = callee_id)
  with check (auth.uid() = callee_id);

do $$
begin
  alter publication supabase_realtime add table public.calls;
exception
  when duplicate_object then null;
end $$;
