'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSessionUser } from './PortalShell';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Field';
import {
  buildThreads,
  listMembers,
  listMessages,
  sendMessage,
  sendVoiceMessage,
  subscribeToMessages,
  voiceIsAvailable,
  type Member,
  type Message,
} from '@/lib/db';
import { VoicePlayer, VoiceRecorder } from './Voice';

function timeOf(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function ChatClient() {
  const me = useSessionUser();
  const params = useSearchParams();

  /**
   * The recorder only appears once the migration has been run. Showing a
   * microphone that always errors is worse than not showing one.
   */
  const [voiceReady, setVoiceReady] = useState(false);
  useEffect(() => {
    void voiceIsAvailable().then(setVoiceReady);
  }, []);
  const initialTo = params.get('to');

  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialTo);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);

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

  const active = activeId ? membersById.get(activeId) ?? null : null;

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
    <div className="grid h-[calc(100svh-8.5rem)] lg:h-[100svh] lg:grid-cols-[20rem_1fr]">
      {/* ------------------------------ Threads ------------------------------ */}
      <aside
        className={`flex min-h-0 flex-col border-r border-sage/25 ${
          active ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="border-b border-sage/25 px-5 py-5">
          <h1 className="font-serif text-2xl font-medium text-forest">Chat</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {threads.length
              ? `${threads.length} ${threads.length === 1 ? 'conversation' : 'conversations'}`
              : 'No conversations yet'}
          </p>
        </div>

        <div className="no-bar min-h-0 flex-1 overflow-y-auto p-3">
          {loading && <p className="px-2 py-4 text-ink-muted">Loading…</p>}

          {!loading && threads.length === 0 && (
            <div className="px-2 py-6">
              <p className="text-olive">
                Your conversations will appear here. Find someone to talk to first.
              </p>
              <Link
                href="/portal/find"
                className="mt-4 inline-flex min-h-[var(--bh-tap)] items-center rounded-full bg-forest px-6 font-semibold text-cream"
              >
                Find people
              </Link>
            </div>
          )}

          <ul className="space-y-1">
            {threads.map((thread) => {
              const selected = thread.otherId === activeId;
              return (
                <li key={thread.otherId}>
                  <button
                    type="button"
                    onClick={() => setActiveId(thread.otherId)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full min-h-[var(--bh-tap)] items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      selected ? 'bg-sage-mist/70' : 'hover:bg-sage-mist/40'
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-mist text-lg font-bold text-forest">
                      {thread.member.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-forest">
                          {thread.member.name}
                        </span>
                        <span className="shrink-0 text-xs text-ink-muted">
                          {timeOf(thread.created_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-muted">
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

      {/* --------------------------- Conversation --------------------------- */}
      <section
        className={`flex min-h-0 flex-col ${active ? 'flex' : 'hidden lg:flex'}`}
        aria-label="Conversation"
      >
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center">
            <div>
              <p className=" max-w-sm text-lg text-olive">
                Choose a conversation, or find someone new to talk to.
              </p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-sage/25 px-5 py-4">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sage-mist/60 lg:hidden"
              >
                <span className="sr-only">Back to conversations</span>
                <span aria-hidden="true">←</span>
              </button>

              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-mist text-lg font-bold text-forest">
                {active.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-forest">
                  {active.name}
                  {active.age ? `, ${active.age}` : ''}
                  {active.city ? ` — ${active.city}` : ''}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-sage">
                  <span className="h-2 w-2 rounded-full bg-sage" />
                  Active now
                </span>
              </span>
            </header>

            <div ref={scroller} className="no-bar min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-6">
              {conversation.length === 0 && (
                <p className="py-10 text-center text-ink-muted">
                  Say hello. A first message is always the hardest one.
                </p>
              )}

              {conversation.map((m) => {
                const mine = m.sender === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
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
                              ? 'rounded-br-lg bg-forest text-cream'
                              : 'rounded-bl-lg bg-sage-mist text-forest'
                          }`}
                        >
                          {m.body}
                        </div>
                      )}
                      <p
                        className={`mt-1 text-xs text-ink-muted ${
                          mine ? 'text-right' : ''
                        }`}
                      >
                        {timeOf(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="px-5 pb-2">
                <Notice tone="error">{error}</Notice>
              </div>
            )}

            <div className="border-t border-sage/25 px-5 py-4">
              <div className="flex items-end gap-2">
                {voiceReady && (
                  <VoiceRecorder onRecorded={(b, ms) => void onVoice(b, ms)} disabled={sending} />
                )}
                <label className="flex-1">
                  <span className="sr-only">Write a message</span>
                  <textarea
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
                    placeholder="Write a message…"
                    className="min-h-[var(--bh-tap)] w-full resize-none rounded-3xl border-2 border-sage/30 bg-parchment px-5 py-3.5 text-base text-forest outline-none focus:border-sage"
                  />
                </label>
                <Button
                  onClick={() => void onSend()}
                  disabled={!draft.trim() || sending}
                  className="px-6"
                >
                  {sending ? '…' : 'Send'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {voiceReady
                  ? 'Press Enter to send, or use the microphone to record.'
                  : 'Video calls are coming soon. Press Enter to send.'}
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
