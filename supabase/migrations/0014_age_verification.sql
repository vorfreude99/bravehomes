-- Age verification via Didit
--
-- Run after 0013. The site collects `age` at signup, but nothing ever
-- checked it was real. Every member now has to pass a facial age
-- estimation before they can use /portal at all — see src/proxy.ts for
-- the gate; src/app/api/webhooks/didit/route.ts and
-- src/app/api/didit/status/route.ts write the result here.

alter table public.profiles
  add column if not exists age_verification_status text not null default 'unverified'
    check (age_verification_status in ('unverified', 'pending', 'approved', 'declined')),
  add column if not exists age_verification_session_id text;

-- 0011 replaced the table-level select grant with a column list, so a
-- new column is invisible to `authenticated` until granted here too —
-- without this, ANY profile select that touches these columns fails
-- outright with "permission denied for table profiles", and the
-- verify-age flow polls forever while the webhook-written approval
-- sits unreadable in the row.
grant select (age_verification_status, age_verification_session_id)
  on public.profiles to authenticated;

-- Same hole as 0009, same fix. `update own profile` is row-scoped, not
-- column-scoped, so without this a signed-in member could run
--
--   supabase.from('profiles').update({ age_verification_status: 'approved' }).eq('id', myId)
--
-- from devtools and skip verification entirely. This trigger means only
-- the service-role key (used by /api/didit/session and the webhook, never
-- the browser) can move either column.
create or replace function public.prevent_self_age_verification_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.age_verification_status is distinct from old.age_verification_status
    or new.age_verification_session_id is distinct from old.age_verification_session_id
  ) and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'age_verification fields can only be changed with the service-role key';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_age_verification on public.profiles;
create trigger guard_age_verification
  before update on public.profiles
  for each row
  execute function public.prevent_self_age_verification_change();
