-- Every account gets a profile row
--
-- Run after 0000. Fixes a real failure: accounts created before the
-- schema existed have no row in `profiles`, so anything that UPDATEs
-- that row silently affects nothing — an uploaded avatar landed in
-- storage and its URL was never stored.

-- 1. Backfill anyone who is missing one.
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 2. And make it automatic from here, so the app never depends on a
--    client-side write succeeding right after sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
