'use client';

import { createClient } from './supabase/client';

export type Member = {
  id: string;
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
  /** Set once the recipient opens this conversation. Null until 0008 runs. */
  read_at?: string | null;
};

export type CallLog = {
  id: string;
  caller_id: string;
  callee_id: string;
  status: 'missed' | 'declined';
  created_at: string;
  seen_at: string | null;
};

export type Notification =
  | {
      kind: 'message';
      otherId: string;
      member: Member | null;
      preview: string;
      count: number;
      created_at: string;
    }
  | {
      kind: 'call';
      id: string;
      otherId: string;
      member: Member | null;
      status: CallLog['status'];
      seen: boolean;
      created_at: string;
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
  return p?.full_name?.trim() || 'Member';
}

function toMember(row: Record<string, unknown>): Member {
  const p = row as unknown as Member;
  return { ...p, interests: p.interests ?? [], name: displayName(p) };
}

/**
 * The columns any member is allowed to see about anyone else — deliberately
 * not `email`, which 0011_hide_email_column.sql revokes at the database
 * level for the `authenticated` role. A member's own email always comes
 * from their Supabase Auth session (`useSessionUser().email`), never
 * from querying `profiles`, so nothing legitimate needs it back.
 */
const PUBLIC_MEMBER_COLUMNS = 'id, full_name, age, city, bio, interests, avatar_url, updated_at';

/* ------------------------------- members ------------------------------- */

export async function listMembers(excludeId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_MEMBER_COLUMNS)
    .order('updated_at', { ascending: false });

  if (error) return { members: [] as Member[], error };

  const rows = (data ?? []) as Record<string, unknown>[];
  const members = rows.filter((p) => p.id !== excludeId).map(toMember);

  return { members, error: null };
}

export async function getProfile(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select(PUBLIC_MEMBER_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  return data ? toMember(data as Record<string, unknown>) : null;
}

/**
 * `email` is deliberately not part of `Member` (nothing reads it back —
 * 0011 revokes SELECT on it for everyone but the row's own owner), but
 * it's still a legitimate write: keeping `profiles.email` in sync with
 * the session's actual auth email is fine, since only the owner's own
 * `update own profile` RLS policy ever lets this through for their row.
 */
/**
 * A plain `UPDATE`, not `.upsert()` — every profile already exists by
 * the time anyone can sign in and edit one (0004_profile_on_signup.sql's
 * trigger creates the row at signup), so there's never actually a row
 * to insert here. This matters more than it looks: `.upsert()` compiles
 * to `INSERT ... ON CONFLICT DO UPDATE`, and Postgres requires SELECT
 * privilege on the *whole row* to evaluate that conflict — which
 * 0011_hide_email_column.sql's column-restricted grant no longer gives
 * `authenticated` (deliberately, to keep other members' emails
 * unreadable). A plain `UPDATE ... WHERE id = ...` never needs that.
 */
export async function upsertProfile(
  id: string,
  patch: Partial<Member> & { email?: string | null },
) {
  const supabase = createClient();
  return supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
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
 * The extension has to match what `MediaRecorder` actually produced, not
 * just default to `.webm` — Safari records `audio/mp4`, never webm, and
 * a mislabelled file is what silently refuses to play back later.
 */
function extensionFor(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
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
  const mimeType = blob.type || 'audio/webm';
  const path = `${sender}/${crypto.randomUUID()}.${extensionFor(mimeType)}`;

  const up = await supabase.storage
    .from('voice-messages')
    .upload(path, blob, { contentType: mimeType });

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

/** Marks every message from one person as read. Silently a no-op before 0008. */
export async function markThreadRead(userId: string, otherId: string) {
  const supabase = createClient();
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient', userId)
    .eq('sender', otherId)
    .is('read_at', null);

  // The notification bell only refetches on a new realtime row or a
  // route change — neither happens when you're already sitting in the
  // conversation you just read, so it would otherwise keep showing a
  // stale unread badge until something else nudges it.
  window.dispatchEvent(new Event('bh:inbox-changed'));
}

/**
 * What the bell shows: one row per person with an unread message
 * (newest first), plus missed calls, newest first. Both come back empty
 * — rather than erroring — before 0008 has been run.
 */
export async function getNotifications(
  userId: string,
  membersById: Map<string, Member>,
): Promise<Notification[]> {
  const supabase = createClient();

  const [{ data: unread }, { data: calls }] = await Promise.all([
    supabase
      .from('messages')
      .select('sender, body, created_at')
      .eq('recipient', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('calls')
      .select('*')
      .eq('callee_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const bySender = new Map<string, { preview: string; count: number; created_at: string }>();
  for (const m of (unread ?? []) as Pick<Message, 'sender' | 'body' | 'created_at'>[]) {
    const prev = bySender.get(m.sender);
    if (!prev) {
      bySender.set(m.sender, { preview: m.body, count: 1, created_at: m.created_at });
    } else {
      prev.count += 1;
    }
  }

  const messageNotifs: Notification[] = [...bySender.entries()].map(([otherId, v]) => ({
    kind: 'message',
    otherId,
    member: membersById.get(otherId) ?? null,
    preview: v.preview,
    count: v.count,
    created_at: v.created_at,
  }));

  const callNotifs: Notification[] = ((calls ?? []) as CallLog[]).map((c) => ({
    kind: 'call',
    id: c.id,
    otherId: c.caller_id,
    member: membersById.get(c.caller_id) ?? null,
    status: c.status,
    seen: Boolean(c.seen_at),
    created_at: c.created_at,
  }));

  return [...messageNotifs, ...callNotifs].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
}

/** Marks every missed-call notification as seen (does not affect unread messages). */
export async function markCallsSeen(userId: string) {
  const supabase = createClient();
  await supabase
    .from('calls')
    .update({ seen_at: new Date().toISOString() })
    .eq('callee_id', userId)
    .is('seen_at', null);
}

/**
 * Tells the bell to refetch whenever something arrives that would change
 * it — a new message, or a call just logged as missed/declined. It does
 * not hand back the row: `getNotifications` already knows how to group
 * and sort them, so refetching is simpler than reconciling here.
 */
export function subscribeToInbox(userId: string, onChange: () => void) {
  const supabase = createClient();

  const channel = supabase
    .channel(`inbox:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: { new: Record<string, unknown> }) => {
        if (payload.new.recipient === userId) onChange();
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'calls' },
      (payload: { new: Record<string, unknown> }) => {
        if (payload.new.callee_id === userId) onChange();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ------------------------------ donations ------------------------------ */

export type DonationResult =
  | { ok: true }
  | { ok: false; reason: 'no-table' | 'error'; message: string };

/**
 * Records a pledge without taking a card.
 *
 * The fallback for when Stripe keys aren't set: `/api/checkout` answers
 * 503 and the donate page stores the intent here instead, saying plainly
 * that nothing has been charged. Real payments go through Stripe and are
 * marked paid by the webhook, never from the browser.
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

/**
 * What this donor has actually given.
 *
 * `status = 'paid'` only — an intent nobody completed isn't a gift yet,
 * and counting it would show someone a total that isn't true. A gift
 * that was later *partially* refunded stays `status = 'paid'` (some of
 * it genuinely arrived) but has `refunded_amount` subtracted, so the
 * total reflects exactly what's left, not what was first given. RLS
 * already limits `pledges` reads to your own rows, so this can never
 * see anyone else's giving.
 */
export async function getMyGivingTotal(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pledges')
    .select('amount, refunded_amount')
    .eq('user_id', userId)
    .eq('status', 'paid');

  if (error || !data) return { total: 0, count: 0 };

  const rows = data as { amount: number; refunded_amount: number | null }[];
  return {
    total: rows.reduce((sum, row) => sum + row.amount - (row.refunded_amount ?? 0), 0),
    count: rows.length,
  };
}

export type GivingRecord = {
  id: string;
  amount: number;
  paid_at: string;
  /** 'paid' unless Stripe reports the gift was later fully refunded. */
  status: 'paid' | 'refunded';
  /** How much of `amount` has been given back, if any (0 for most gifts). */
  refunded_amount: number;
};

/**
 * Every gift this donor has actually made, most recent first — the
 * receipts behind the total on their profile.
 *
 * Refunded gifts are included, not hidden: a receipt that quietly
 * disappeared would read as a bug, not as "we gave your money back."
 * They just don't count toward the total above — that's `getMyGivingTotal`
 * filtering to `paid` only, which this deliberately doesn't. Same RLS:
 * a person can only ever see their own rows.
 */
export async function getMyGivingHistory(userId: string): Promise<GivingRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pledges')
    .select('id, amount, paid_at, status, refunded_amount')
    .eq('user_id', userId)
    .in('status', ['paid', 'refunded'])
    .order('paid_at', { ascending: false });

  if (error || !data) return [];
  return data as GivingRecord[];
}
