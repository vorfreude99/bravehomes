-- Profile photos
--
-- Run after 0000. The app hides the uploader until this has been run.

alter table public.profiles
  add column if not exists avatar_url text;

-- Public, unlike the voice bucket. A profile photo is shown to every
-- signed-in member by definition, and signing a URL for each face in a
-- list of fifty would mean fifty round trips before the page can draw.
-- Paths are `<user id>/<uuid>`, so they are not guessable.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "own avatar upload" on storage.objects;
create policy "own avatar upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own avatar replace" on storage.objects;
create policy "own avatar replace"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own avatar delete" on storage.objects;
create policy "own avatar delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "read avatars" on storage.objects;
create policy "read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
