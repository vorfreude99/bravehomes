-- Age at sign-up
--
-- Run after 0004. The sign-up form now asks for age — it is how the app
-- knows who is the older and who is the younger person. The trigger
-- carries it into the profile even when email confirmation delays the
-- client-side write.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, age)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'age', '')::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
