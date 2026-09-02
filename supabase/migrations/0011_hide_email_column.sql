-- Stop every member reading every other member's email
--
-- Run after 0010. "members read profiles" (0000_schema.sql) is
-- row-scoped, not column-scoped: `using (true)` for `authenticated`
-- means any signed-in member can already read every OTHER member's
-- `email` column, not just the fields the app's own UI chooses to
-- select — a direct query from their own browser session
-- (`supabase.from('profiles').select('email')`) bypasses whatever the
-- app's own code does or doesn't ask for. For an elderly/vulnerable
-- userbase, that is a real PII leak, not a hypothetical one.
--
-- Nothing legitimate needs to read it through the `authenticated` role:
-- a signed-in member's own email comes from their Supabase Auth
-- session (`useSessionUser().email`), never from querying `profiles`.
-- The admin panel reads it through the service-role key, which this
-- does not touch. So rather than a conditional "only your own row" rule
-- (Postgres has no native column-level RLS), email is revoked outright
-- for the `authenticated` role and only readable with the service-role
-- key from here on.

revoke select on public.profiles from authenticated;

grant select (
  id, full_name, age, city, bio, interests, avatar_url, updated_at, is_admin
) on public.profiles to authenticated;
