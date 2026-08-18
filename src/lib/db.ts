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
};

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
    .select('id, sender, recipient, body, created_at')
    .or(`sender.eq.${userId},recipient.eq.${userId}`)
    .order('created_at', { ascending: true });

  return { messages: (data ?? []) as Message[], error };
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
