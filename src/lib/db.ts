'use client';

import { createClient } from './supabase/client';

export type Member = {
  id: string;
  email: string | null;
  full_name: string | null;
  age: number | null;
  city: string | null;
  bio: string | null;
  interests: string[];
  /** Public URL of the profile photo. Null until one is uploaded. */
  avatar_url?: string | null;
  updated_at: string | null;
  /** Derived display name — never empty. */
  name: string;
};

export type Message = {
  id: string;
  sender: string;
  recipient: string;
  body: string;
  created_at: string;
  /** 'text' unless the migration has been run and this is a voice note. */
  kind?: 'text' | 'voice';
  /** Path inside the private `voice-messages` bucket. */
  audio_path?: string | null;
  duration_ms?: number | null;
};

/** Mirrors `DonationResult`: the UI can say what is missing, not just fail. */
export type SendResult =
  | { ok: true }
  | { ok: false; reason: 'no-column' | 'no-bucket' | 'error'; message: string };

export type Thread = {
  otherId: string;
  last: string;
  created_at: string;
  member: Member;
};

function displayName(p: Partial<Member> | null): string {
  return p?.full_name?.trim() || p?.email?.split('@')[0] || 'Member';
}

function toMember(row: Record<string, unknown>): Member {
  const p = row as unknown as Member;
  return { ...p, interests: p.interests ?? [], name: displayName(p) };
}

/* ------------------------------- members ------------------------------- */

export async function listMembers(excludeId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, age, city, bio, interests, updated_at')
    .order('updated_at', { ascending: false });

  if (error) return { members: [] as Member[], error };

  const rows = (data ?? []) as Record<string, unknown>[];
  const members = rows.filter((p) => p.id !== excludeId).map(toMember);

  return { members, error: null };
}

export async function getProfile(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data ? toMember(data as Record<string, unknown>) : null;
}

export async function upsertProfile(id: string, patch: Partial<Member>) {
  const supabase = createClient();
  return supabase
    .from('profiles')
    .upsert({ id, ...patch, updated_at: new Date().toISOString() });
}

/* ------------------------------ messages ------------------------------- */

export async function listMessages(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender.eq.${userId},recipient.eq.${userId}`)
    .order('created_at', { ascending: true });

  return { messages: (data ?? []) as Message[], error };
}

/* ------------------------------ avatars -------------------------------- */

/** True once `0003_avatars.sql` has been run. */
export async function avatarsAvailable(): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('profiles').select('avatar_url').limit(1);
  return !error;
}

/**
 * Replaces the profile photo and returns its public URL.
 *
 * `upsert` on a fixed path per person rather than a new file each time,
 * so changing your photo does not leave the old one behind for ever.
 */
export async function uploadAvatar(userId: string, file: File) {
  const supabase = createClient();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  const up = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
  if (up.error) return { url: null as string | null, error: up.error.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust: the path is stable, so browsers would keep the old face.
  const url = `${data.publicUrl}?v=${Date.now()}`;

  // `upsert`, not `update`. An update against a missing row matches
  // nothing and reports no error, so the file uploaded and the URL was
  // quietly dropped — which is exactly what happened to accounts made
  // before the schema existed.
  const { data: rows, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() })
    .select('id');

  if (error) return { url: null as string | null, error: error.message };
  if (!rows?.length) {
    return { url: null as string | null, error: 'Your profile row could not be written.' };
  }

  return { url, error: null as string | null };
}

/* ------------------------------- voice --------------------------------- */

/** True once `0001_voice_messages.sql` has been run. */
export async function voiceIsAvailable(): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('messages').select('kind').limit(1);
  return !error;
}

/**
 * Uploads the recording, then writes the row that points at it.
 *
 * The file goes under `<sender>/`, which is what the storage policy
 * checks — the first folder segment has to be the uploader's own id.
 */
export async function sendVoiceMessage(
  sender: string,
  recipient: string,
  blob: Blob,
  durationMs: number,
): Promise<SendResult> {
  const supabase = createClient();
  const path = `${sender}/${crypto.randomUUID()}.webm`;

  const up = await supabase.storage
    .from('voice-messages')
    .upload(path, blob, { contentType: blob.type || 'audio/webm' });

  if (up.error) {
    const missing = /bucket not found/i.test(up.error.message);
    return {
      ok: false,
      reason: missing ? 'no-bucket' : 'error',
      message: up.error.message,
    };
  }

  const seconds = Math.max(1, Math.round(durationMs / 1000));
  const { error } = await supabase.from('messages').insert({
    sender,
    recipient,
    // `body` is also the thread preview, so it has to read as something.
    body: `Voice message · ${seconds}s`,
    kind: 'voice',
    audio_path: path,
    duration_ms: durationMs,
  });

  if (error) {
    // Row failed, so the file is orphaned — take it back out.
    await supabase.storage.from('voice-messages').remove([path]);
    const missing = error.code === '42703' || /column .* does not exist/i.test(error.message);
    return {
      ok: false,
      reason: missing ? 'no-column' : 'error',
      message: error.message,
    };
  }

  return { ok: true };
}

/**
 * A short-lived URL for one recording. The bucket is private, so the
 * file cannot simply be linked.
 */
export async function voiceUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from('voice-messages')
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function sendMessage(sender: string, recipient: string, body: string) {
  const supabase = createClient();
  return supabase.from('messages').insert({ sender, recipient, body });
}

/**
 * Live updates for the signed-in user's messages.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(userId: string, onInsert: (m: Message) => void) {
  const supabase = createClient();

  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: { new: Record<string, unknown> }) => {
        const m = payload.new as unknown as Message;
        if (m.sender === userId || m.recipient === userId) onInsert(m);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Collapse a flat message list into one thread per correspondent. */
export function buildThreads(
  messages: Message[],
  myId: string,
  membersById: Map<string, Member>,
): Thread[] {
  const map = new Map<string, Omit<Thread, 'member'>>();

  for (const m of messages) {
    const otherId = m.sender === myId ? m.recipient : m.sender;
    const prev = map.get(otherId);
    if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
      map.set(otherId, { otherId, last: m.body, created_at: m.created_at });
    }
  }

  return [...map.values()]
    .map((t) => ({ ...t, member: membersById.get(t.otherId) }))
    .filter((t): t is Thread => Boolean(t.member))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

/* ------------------------------ donations ------------------------------ */

export type DonationResult =
  | { ok: true }
  | { ok: false; reason: 'no-table' | 'error'; message: string };

/**
 * Records a pledge. Payment capture is not wired up yet — this stores
 * the intent only, and the UI says so rather than implying a charge.
 */
export async function recordPledge(
  userId: string,
  amount: number,
  projectId: string,
): Promise<DonationResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('pledges')
    .insert({ user_id: userId, amount, project_id: projectId });

  if (!error) return { ok: true };

  // 42P01 = undefined_table. Treated separately so setup is obvious.
  const missing = error.code === '42P01' || /does not exist/i.test(error.message);
  return {
    ok: false,
    reason: missing ? 'no-table' : 'error',
    message: error.message,
  };
}
