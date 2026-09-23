-- Column-scoped writes for messages and profiles
--
-- Run after 0015 (which was withdrawn — 0014 is the real predecessor).
--
-- Two instances of the same hole 0011 fixed for reads: an UPDATE policy
-- is row-scoped, not column-scoped, so "may update this row" quietly
-- means "may update every column of it".
--
-- 1. messages: the "mark received read" policy let a recipient rewrite
--    body, sender, kind and audio_path of anything sent to them —
--    fabricated messages appearing to come from any member. From here,
--    a recipient can flip read_at and nothing else.
--
-- 2. profiles: writes go column-scoped the way 0011 made reads, which
--    makes the bespoke guard triggers from 0009 (is_admin) and 0014
--    (age_verification_*) redundant — those columns simply have no
--    UPDATE grant for `authenticated` any more. Dropping the triggers
--    also unblocks the SQL editor, where auth.role() is null and both
--    triggers rejected every legitimate operator fix. New sensitive
--    columns are now locked by default instead of waiting for trigger
--    number three.

-- ------------------------------ messages ------------------------------
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- ------------------------------ profiles ------------------------------
revoke update on public.profiles from authenticated;
grant update (full_name, age, city, bio, interests, avatar_url, email, updated_at)
  on public.profiles to authenticated;

drop trigger if exists guard_is_admin on public.profiles;
drop function if exists public.prevent_self_admin_grant();

drop trigger if exists guard_age_verification on public.profiles;
drop function if exists public.prevent_self_age_verification_change();
