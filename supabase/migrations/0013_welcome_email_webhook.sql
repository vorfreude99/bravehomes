-- Welcome email on signup
--
-- A second, independent trigger on `auth.users` insert, alongside the
-- existing `on_auth_user_created` from 0004 — kept separate rather than
-- folded into `handle_new_user()` so a broken email call can never risk
-- the profile-seeding logic that trigger already handles.
--
-- Fires an HTTP POST at `/api/webhooks/new-account` via `pg_net`, which
-- sends the actual welcome email through Resend. `pg_net` queues the
-- request and returns immediately — it does not wait for a response, so
-- a slow or failing email provider can never block a signup.
--
-- IMPORTANT: replace both the URL and the secret below to match the
-- `SUPABASE_WEBHOOK_SECRET` value set in Vercel before running this.
-- The secret is the only thing verifying these requests actually came
-- from this trigger — see `src/app/api/webhooks/new-account/route.ts`.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://bravehomes.co.uk/api/webhooks/new-account',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '7c850dad6653ac17fd5b18b79bac92e7ed9c6ba63a78b05fbb4e618282caf5ee'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'email', new.email,
        'raw_user_meta_data', new.raw_user_meta_data
      )
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_welcome_email on auth.users;
create trigger on_auth_user_created_welcome_email
  after insert on auth.users
  for each row execute function public.notify_new_account();
