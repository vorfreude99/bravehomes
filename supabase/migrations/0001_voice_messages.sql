-- Voice messages
--
-- Run this in Supabase → SQL Editor. The app degrades gracefully if it
-- has not been run: recording is hidden and text chat carries on.

-- 1. Columns on `messages`. `body` stays the text (and doubles as the
--    thread preview), so a voice note writes a short label there too.
alter table public.messages
  add column if not exists kind text not null default 'text',
  add column if not exists audio_path text,
  add column if not exists duration_ms integer;

alter table public.messages
  drop constraint if exists messages_kind_check;
alter table public.messages
  add constraint messages_kind_check check (kind in ('text', 'voice'));

-- 2. A private bucket for the audio. Private, not public: a voice note
--    between two people is not something to leave on an open URL.
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', false)
on conflict (id) do nothing;

-- 3. Who may touch a file. Paths are `<sender>/<uuid>.webm`, so the
--    first folder segment is the owner's id.
drop policy if exists "own voice uploads" on storage.objects;
create policy "own voice uploads"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Either side of a conversation may listen: the sender, or anyone the
-- sender has actually sent a message to.
drop policy if exists "read voice in own threads" on storage.objects;
create policy "read voice in own threads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'voice-messages'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.messages m
        where m.audio_path = storage.objects.name
          and (m.sender = auth.uid() or m.recipient = auth.uid())
      )
    )
  );

drop policy if exists "delete own voice" on storage.objects;
create policy "delete own voice"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
