-- Base schema for Brave Homes
--
-- Run this FIRST, in Supabase → SQL Editor, before 0001.
-- Supabase Auth provides `auth.users` on its own; everything the app
-- reads and writes lives here.

/* ------------------------------- profiles ------------------------------ */

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  age         integer,
  city        text,
  bio         text,
  interests   text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- The product is people finding each other, so any signed-in member can
-- read the directory. Anonymous visitors cannot: the anon key has been
-- public since the old site's bundle, so `authenticated` is the line
-- that actually protects this.
drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "write own profile" on public.profiles;
create policy "write own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

/* ------------------------------- messages ------------------------------ */

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender      uuid not null references auth.users (id) on delete cascade,
  recipient   uuid not null references auth.users (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_sender_idx on public.messages (sender);
create index if not exists messages_recipient_idx on public.messages (recipient);
create index if not exists messages_created_idx on public.messages (created_at);

alter table public.messages enable row level security;

-- Only the two people in the conversation. Without this any signed-in
-- member could read everyone's private messages.
drop policy if exists "read own messages" on public.messages;
create policy "read own messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender or auth.uid() = recipient);

-- You may only send as yourself.
drop policy if exists "send as self" on public.messages;
create policy "send as self"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender);

-- Live updates in chat depend on this; without it messages only appear
-- after a refetch.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
