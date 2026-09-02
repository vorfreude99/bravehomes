'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useHideShellChrome, useSessionUser } from './PortalShell';
import { Notice } from '@/components/ui/Field';
import {
  buildThreads,
  listMembers,
  listMessages,
  markThreadRead,
  sendMessage,
  sendVoiceMessage,
  subscribeToMessages,
  voiceIsAvailable,
  type Member,
  type Message,
} from '@/lib/db';
import { VoicePlayer, VoiceRecorder } from './Voice';
import { useCalls } from './CallProvider';
import { Icon } from '@/components/ui/Icon';

const INK = '#1a1a1a';
const YELLOW = '#f5d64e';

function dayOf(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

function timeOf(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * One person's face — their photo when they have one, their initial
 * when they don't. `dark` flips the initial's colours for the ink rail.
 */
function Face({
  member,
  size,
  dark = false,
  className = '',
}: {
  member: Pick<Member, 'name' | 'avatar_url'> | null;
  size: number;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${
        dark ? 'bg-white/15 text-white' : 'bg-[#1a1a1a]/[0.07] text-[#1a1a1a]'
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {member?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name ?? '?').charAt(0).toUpperCase()
      )}
    </span>
  );
}

export function ChatClient() {
  const me = useSessionUser();
  const params = useSearchParams();

  /**
   * The recorder only appears once the migration has been run. Showing a
   * microphone that always errors is worse than not showing one.
   */
  const calls = useCalls();
  const [voiceReady, setVoiceReady] = useState(false);
  useEffect(() => {
    void voiceIsAvailable().then(setVoiceReady);
  }, []);
  const toParam = params.get('to');

  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(toParam);

  /**
   * `?to=` is only read as the *initial* state above — `useState` never
   * looks at it again. That's fine for landing on this page fresh, but a
   * link that navigates here while it's already mounted (the
   * notification bell, e.g. `/portal/chat?to=X` → `/portal/chat?to=Y`)
   * changes the param without React ever re-reading it, so the target
   * conversation never actually opens. This keeps it in sync for real
   * navigations without clobbering a manual pick from the thread list,
   * since clicking a thread there doesn't touch the URL at all.
   */
  useEffect(() => {
    if (toParam) setActiveId(toParam);
  }, [toParam]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  /**
   * Grows with what you type, up to five or so lines, then scrolls —
   * a fixed one-line box that just clips a longer message (or the
   * "Write a message" placeholder itself, on a narrow phone) is the
   * one thing that made this page feel like a form field instead of a
   * conversation. Runs on every `draft` change, including the reset to
   * `''` after sending, so it shrinks back down too.
   */
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [draft]);

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [{ members: list, error: memberError }, { messages: msgs, error: msgError }] =
      await Promise.all([listMembers(me.id), listMessages(me.id)]);

    if (memberError || msgError) {
      setError(
        'We could not load your conversations. Check your connection and try again.',
      );
    } else {
      setError(null);
    }

    setMembers(list);
    setMessages(msgs);
    setLoading(false);
  }, [me.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live inserts, so a reply lands without a refresh.
  useEffect(() => {
    return subscribeToMessages(me.id, (m) => {
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
    });
  }, [me.id]);

  const threads = useMemo(
    () => buildThreads(messages, me.id, membersById),
    [messages, me.id, membersById],
  );

  /** People you have not written to yet — the ones worth offering. */
  const suggestions = useMemo(() => {
    const known = new Set(threads.map((t) => t.otherId));
    return members.filter((m) => !known.has(m.id)).slice(0, 3);
  }, [members, threads]);

  const active = activeId ? membersById.get(activeId) ?? null : null;

  // An open conversation takes over the screen on mobile, the way a
  // real messaging app's thread view does, instead of a card floating
  // inside the portal's usual header and tab bar. Scoped to just this
  // view, not the thread list behind it — the list is the only place on
  // this page that still has the tab bar, and thereby a way to leave
  // chat entirely; losing that here would be a dead end, not a screen
  // that "goes bigger". `lg:` ignores all of this; see
  // `useHideShellChrome`.
  useHideShellChrome(Boolean(active));

  const conversation = useMemo(() => {
    if (!activeId) return [];
    return messages.filter(
      (m) =>
        (m.sender === me.id && m.recipient === activeId) ||
        (m.sender === activeId && m.recipient === me.id),
    );
  }, [messages, activeId, me.id]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [conversation.length, activeId]);

  // Opening a conversation is what "read" means — not seeing a preview
  // of it in the notification bell.
  useEffect(() => {
    if (activeId) void markThreadRead(me.id, activeId);
  }, [activeId, me.id, conversation.length]);

  async function onSend() {
    const body = draft.trim();
    if (!body || !activeId || sending) return;

    setSending(true);
    const { error: sendError } = await sendMessage(me.id, activeId, body);
    setSending(false);

    if (sendError) {
      setError('That message did not send. Please try again.');
      return;
    }

    setDraft('');
    // Realtime echoes the row back; refetch keeps us right if it doesn't.
    const { messages: fresh } = await listMessages(me.id);
    setMessages(fresh);
  }

  async function onVoice(blob: Blob, durationMs: number) {
    if (!activeId || sending) return;

    setSending(true);
    const result = await sendVoiceMessage(me.id, activeId, blob, durationMs);
    setSending(false);

    if (!result.ok) {
      // Say which piece of setup is missing rather than "try again",
      // which would be a lie when the bucket simply is not there.
      setError(
        result.reason === 'no-bucket'
          ? 'Voice messages need the storage bucket from 0001_voice_messages.sql.'
          : result.reason === 'no-column'
            ? 'Voice messages need 0001_voice_messages.sql to be run first.'
            : 'That voice message did not send. Please try again.',
      );
      return;
    }

    setError(null);
    const { messages: fresh } = await listMessages(me.id);
    setMessages(fresh);
  }

  return (
    <div
      className={`grid gap-4 lg:-mb-6 lg:h-[calc(100svh-5.5rem)] lg:grid-cols-[22rem_1fr] lg:px-8 ${
        active ? 'h-svh' : 'h-[calc(100svh-9.5rem)] px-5 sm:px-8'
      }`}
    >
      {/* --------------------------- Thread rail ---------------------------
          Dark, like the dashboard's photo tile — it frames the white
          conversation panel instead of dissolving into it. Only ever
          visible with the portal's own chrome around it (an open
          conversation hides this whole panel), so it keeps its rounded
          card corners at every width — nothing here needs the full-bleed
          treatment the conversation view gets. */}
      <aside
        className={`min-h-0 flex-col overflow-hidden rounded-[2rem] text-white ${
          active ? 'hidden lg:flex' : 'flex'
        }`}
        style={{ background: INK }}
      >
        <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            <p className="mt-0.5 text-sm text-white/50">
              {threads.length
                ? `${threads.length} ${threads.length === 1 ? 'conversation' : 'conversations'}`
                : 'Nobody yet — let’s fix that'}
            </p>
          </div>
          <Link
            href="/portal/find"
            aria-label="Find someone new to talk to"
            title="Find someone new"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#1a1a1a] transition-transform hover:scale-105"
            style={{ background: YELLOW }}
          >
            <span aria-hidden="true" className="text-xl leading-none">+</span>
          </Link>
        </div>

        <div className="no-bar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {loading && <p className="px-3 py-4 text-white/55">Loading…</p>}

          {!loading && threads.length === 0 && (
            <div className="px-3 py-6">
              <p className="text-white/70">
                Every friendship on here started with one short hello.
              </p>
              <Link
                href="/portal/find"
                className="mt-4 inline-flex min-h-[var(--bh-tap)] items-center rounded-full px-6 font-semibold text-[#1a1a1a]"
                style={{ background: YELLOW }}
              >
                Find someone
              </Link>
            </div>
          )}

          <ul className="space-y-1.5">
            {threads.map((thread) => {
              const selected = thread.otherId === activeId;
              return (
                <li key={thread.otherId}>
                  <button
                    type="button"
                    onClick={() => setActiveId(thread.otherId)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full min-h-[var(--bh-tap)] items-center gap-3 rounded-[1.25rem] px-3 py-3 text-left transition-colors ${
                      selected ? 'text-[#1a1a1a]' : 'text-white hover:bg-white/[0.08]'
                    }`}
                    style={selected ? { background: YELLOW } : undefined}
                  >
                    <Face member={thread.member} size={46} dark={!selected} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold">{thread.member.name}</span>
                        <span
                          className={`shrink-0 text-xs ${
                            selected ? 'text-[#1a1a1a]/60' : 'text-white/45'
                          }`}
                        >
                          {timeOf(thread.created_at)}
                        </span>
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-sm ${
                          selected ? 'text-[#1a1a1a]/70' : 'text-white/55'
                        }`}
                      >
                        {thread.last}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* --------------------------- Conversation ---------------------------
          Square corners full-bleed on mobile — there's no chrome left
          around it to frame — then back to a rounded card once it's
          sharing the screen with the thread rail and the portal's own
          header at `lg`. */}
      <section
        className={`chat-slide-in min-h-0 flex-col overflow-hidden bg-white/75 lg:rounded-[2rem] ${
          active ? 'flex rounded-none' : 'hidden rounded-[2rem] lg:flex'
        }`}
        aria-label="Conversation"
      >
        {!active ? (
          /* Dead space with a dead end in it, before: a full half-screen
             saying "choose a conversation" to someone who has none. It
             offers the next step instead, with real people in it. */
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-2xl text-center">
              <span
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[#1a1a1a]"
                style={{ background: YELLOW }}
              >
                <Icon name="chat" size={28} />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#1a1a1a]">
                {threads.length ? 'Pick up a conversation' : 'Someone’s waiting to hear from you'}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[#1a1a1a]/70">
                {threads.length
                  ? 'Choose someone on the left, or meet somebody new.'
                  : 'Everyone here joined hoping somebody would say hello. You can be that somebody.'}
              </p>

              {suggestions.length > 0 && (
                <>
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
                    Waiting to hear from someone
                  </p>

                  {/* Faces, not a list of rows. These are the people you
                      have not written to yet, and a name on its own asks
                      you to pick a stranger from a list; a face asks you
                      to say hello to a person. */}
                  <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                    {suggestions.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/portal/people/${m.id}`}
                          className="group flex w-full flex-col items-center gap-2 rounded-[1.25rem] border border-[#1a1a1a]/10 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#1a1a1a]/30 hover:shadow-[0_14px_30px_-20px_rgba(26,26,26,0.5)]"
                        >
                          <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a]/[0.07]">
                            {m.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.avatar_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-[#1a1a1a]">
                                {m.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </span>

                          <span className="w-full min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#1a1a1a]">
                              {m.name}
                              {m.age ? `, ${m.age}` : ''}
                            </span>
                            <span className="block truncate text-xs text-[#1a1a1a]/60">
                              {m.city || 'Somewhere in the UK'}
                            </span>
                          </span>

                          <span
                            className="mt-1 w-full rounded-full px-3 py-2 text-xs font-semibold text-[#1a1a1a] transition-colors group-hover:bg-[#1a1a1a] group-hover:text-white"
                            style={{ background: YELLOW }}
                          >
                            See profile
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Link
                href="/portal/find"
                className="mt-6 inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-[#1a1a1a] underline underline-offset-4"
              >
                See everyone
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-[#1a1a1a]/[0.08] px-5 py-4">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#1a1a1a]/[0.05] lg:hidden"
              >
                <span className="sr-only">Back to conversations</span>
                <span aria-hidden="true">←</span>
              </button>

              <Link
                href={`/portal/people/${active.id}`}
                className="flex min-w-0 items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#1a1a1a]"
                title={`See ${active.name}'s profile`}
              >
                <Face member={active} size={48} />
                <span className="min-w-0">
                  {/* The age used to ride on this line too — next to a
                      back button, an avatar and a video-call button on a
                      phone, there wasn't room, and it was the part that
                      got silently cut by the ellipsis. Demoted to the
                      subtitle, where it has a whole empty line to sit
                      in. */}
                  <span className="block truncate text-lg font-bold text-[#1a1a1a]">
                    {active.name}
                  </span>
                  <span className="block truncate text-sm text-[#1a1a1a]/55">
                    {active.age ? `${active.age} · ` : ''}
                    {active.city || 'Member of Brave Homes'}
                  </span>
                </span>
              </Link>

              {calls && (
                <button
                  type="button"
                  onClick={() => calls.call(active.id, active.name)}
                  disabled={calls.busy}
                  aria-label={`Start a video call with ${active.name}`}
                  className="ml-auto flex h-[var(--bh-tap)] shrink-0 items-center gap-2 rounded-full px-4 font-semibold text-[#1a1a1a] transition-all hover:scale-[1.03] disabled:opacity-40 sm:px-5"
                  style={{ background: YELLOW }}
                >
                  <Icon name="video" size={20} />
                  <span className="hidden sm:inline">Video call</span>
                </button>
              )}
            </header>

            <div ref={scroller} className="no-bar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mt-auto space-y-1.5">
              {conversation.length === 0 && (
                <div className="py-10 text-center">
                  <Face member={active} size={64} className="mx-auto" />
                  <p className="mt-4 font-semibold text-[#1a1a1a]">
                    This is the very beginning of you and {active.name.split(' ')[0]}.
                  </p>
                  <p className="mt-1 text-sm text-[#1a1a1a]/60">
                    Say hello. A first message is always the hardest one.
                  </p>
                </div>
              )}

              {conversation.map((m, i) => {
                const mine = m.sender === me.id;
                const prev = conversation[i - 1];
                const next = conversation[i + 1];
                // A stamp under every line is noise. One under the last
                // message of a run says the same thing.
                const endsRun =
                  !next ||
                  next.sender !== m.sender ||
                  new Date(next.created_at).getTime() - new Date(m.created_at).getTime() >
                    5 * 60 * 1000;
                const startsDay =
                  !prev ||
                  new Date(prev.created_at).toDateString() !==
                    new Date(m.created_at).toDateString();

                return (
                  <div key={m.id} className="msg-in">
                    {startsDay && (
                      <div className="py-4 text-center">
                        <span className="inline-block rounded-full bg-[#1a1a1a]/[0.05] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/55">
                          {dayOf(m.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-end gap-2 ${
                        mine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Their face sits beside the last bubble of a run,
                          so a long exchange still reads as two people. */}
                      {!mine &&
                        (endsRun ? (
                          <Face member={active} size={30} className="mb-5" />
                        ) : (
                          <span className="w-[30px] shrink-0" aria-hidden="true" />
                        ))}
                      <div className="max-w-[min(34rem,80%)]">
                        {m.kind === 'voice' && m.audio_path ? (
                          <VoicePlayer
                            path={m.audio_path}
                            durationMs={m.duration_ms}
                            mine={mine}
                          />
                        ) : (
                          <div
                            className={`rounded-3xl px-4 py-3 text-base leading-relaxed ${
                              mine
                                ? 'rounded-br-lg text-[#1a1a1a]'
                                : 'rounded-bl-lg border border-[#1a1a1a]/[0.06] bg-white text-[#1a1a1a] shadow-[0_1px_2px_rgba(26,26,26,0.05)]'
                            }`}
                            style={mine ? { background: YELLOW } : undefined}
                          >
                            {m.body}
                          </div>
                        )}
                        {endsRun && (
                          <p
                            className={`mt-1 px-1 text-[0.7rem] text-[#1a1a1a]/50 ${
                              mine ? 'text-right' : ''
                            }`}
                          >
                            {timeOf(m.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {error && (
              <div className="px-5 pb-2">
                <Notice tone="error">{error}</Notice>
              </div>
            )}

            <div className="px-4 pb-3 sm:px-5 sm:pb-4">
              <div className="chat-composer-shell flex items-end gap-2 rounded-3xl border border-[#1a1a1a]/10 bg-white p-1.5 shadow-[0_10px_30px_-22px_rgba(26,26,26,0.45)]">
                {voiceReady && (
                  <VoiceRecorder onRecorded={(b, ms) => void onVoice(b, ms)} disabled={sending} />
                )}
                <label className="flex-1">
                  <span className="sr-only">Write a message</span>
                  <textarea
                    ref={textarea}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; Shift+Enter makes a new line.
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void onSend();
                      }
                    }}
                    rows={1}
                    // Shorter than "Write a message" on purpose — on a
                    // narrow phone, next to the mic button and the Send
                    // pill, the longer placeholder had no room left and
                    // wrapped onto a second line the fixed-height box
                    // then clipped.
                    placeholder="Message"
                    className="max-h-22 min-h-11 w-full resize-none overflow-y-auto border-none bg-transparent px-2 py-2 text-base text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 sm:px-3"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void onSend()}
                  disabled={!draft.trim() || sending}
                  className="press flex h-11 shrink-0 items-center self-end rounded-full px-4 font-semibold text-white transition-all enabled:hover:scale-[1.03] disabled:opacity-35 sm:px-6"
                  style={{ background: INK }}
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
