-- Admin flag
--
-- Run after 0000. Nobody is an admin by default — flip it on for
-- yourself with:
--
--   update public.profiles set is_admin = true where email = 'you@example.com';
--
-- The admin page re-checks this server-side on every load using the
-- service-role key, never trusting the client, so this column being
-- readable by everyone (it already is, under the existing "members read
-- profiles" policy) does not let anyone grant it to themselves — there
-- is deliberately no policy that allows updating it from the browser.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;
