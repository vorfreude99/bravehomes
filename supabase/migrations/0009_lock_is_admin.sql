-- Close a real privilege-escalation hole
--
-- Run after 0008. 0007's own comment claimed "there is deliberately no
-- policy that allows updating it [is_admin] from the browser" — that was
-- wrong. The `update own profile` policy from 0000_schema.sql is
-- row-scoped only (`using (auth.uid() = id)`), not column-scoped: it
-- already lets a signed-in member update *any* column on their own row,
-- is_admin included. Any member could open devtools and run
--
--   supabase.from('profiles').update({ is_admin: true }).eq('id', myId)
--
-- and the update would pass RLS, because it's their own row. This
-- trigger blocks any change to is_admin unless it comes from the
-- service-role key (which bypasses RLS but NOT triggers), so the admin
-- panel's own server-side re-check of is_admin can't be defeated by
-- forging the flag from the browser.

create or replace function public.prevent_self_admin_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'is_admin can only be changed with the service-role key';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_is_admin on public.profiles;
create trigger guard_is_admin
  before update on public.profiles
  for each row
  execute function public.prevent_self_admin_grant();
