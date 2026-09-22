-- Public campaign donations (first: the Meadow Banks appeal)
--
-- Run after 0014. A campaign gift can come from anyone who lands on the
-- appeal page — a resident's granddaughter, a neighbour — not only from
-- signed-in members, so `user_id` becomes optional. Anonymous pledge
-- rows are only ever written by the server (the service-role client in
-- /api/campaign-checkout); the RLS insert policy still requires
-- auth.uid() = user_id, so a browser cannot forge one directly.
--
-- `donor_email` is only what an anonymous giver types for their Stripe
-- receipt. Signed-in members keep using their account email and leave
-- this null.

alter table public.pledges alter column user_id drop not null;

alter table public.pledges
  add column if not exists donor_email text;
