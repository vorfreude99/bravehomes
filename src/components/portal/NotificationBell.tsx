'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionUser } from './PortalShell';
import { Icon } from '@/components/ui/Icon';
import {
  getNotifications,
  listMembers,
  markCallsSeen,
  subscribeToInbox,
  type Member,
  type Notification,
} from '@/lib/db';

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function Face({ member, size }: { member: Member | null; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1a1a]/[0.07] font-bold text-[#1a1a1a]"
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

/**
 * The bell in the top bar: what happened while you were away.
 *
 * A message you have not opened yet, or a video call nobody answered —
 * both persist in the database precisely so this can catch you up later,
 * not just while your tab happens to be open. It refetches whenever a
 * new row lands over realtime, and again whenever you navigate (opening
 * a conversation elsewhere marks it read, so this needs to notice).
 */
export function NotificationBell() {
  const me = useSessionUser();
  const pathname = usePathname();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const membersRef = useRef<Map<string, Member>>(new Map());

  const refresh = useCallback(async () => {
    if (membersRef.current.size === 0) {
      const { members } = await listMembers(me.id);
      membersRef.current = new Map(members.map((m) => [m.id, m]));
    }
    const notifs = await getNotifications(me.id, membersRef.current);
    setItems(notifs);
  }, [me.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  useEffect(() => subscribeToInbox(me.id, () => void refresh()), [me.id, refresh]);

  // Fires when a thread gets marked read without a route change — e.g.
  // switching between two open conversations without ever leaving
  // /portal/chat, which the pathname-based refetch above can't see.
  useEffect(() => {
    const onChange = () => void refresh();
    window.addEventListener('bh:inbox-changed', onChange);
    return () => window.removeEventListener('bh:inbox-changed', onChange);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unseenCalls = items.filter((n) => n.kind === 'call' && !n.seen).length;
  const unreadMessages = items.filter((n) => n.kind === 'message').length;
  const count = unreadMessages + unseenCalls;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unseenCalls > 0) {
      // Calls are acknowledged just by seeing them here — unlike a
      // message, there's no separate "open it" step to defer to.
      void markCallsSeen(me.id);
      setItems((prev) =>
        prev.map((n) => (n.kind === 'call' ? { ...n, seen: true } : n)),
      );
    }
  }

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        title="Notifications"
        className="relative flex h-[var(--bh-tap)] w-[var(--bh-tap)] items-center justify-center rounded-full border border-[#1a1a1a]/15 text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-[#f5f3ef]"
      >
        <Icon name="bell" size={19} />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-bold text-[#1a1a1a]"
            style={{ background: '#f5d64e' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="pop-in absolute right-0 top-[calc(100%+0.625rem)] z-50 w-80 max-w-[calc(100vw-2.5rem)] origin-top-right rounded-[1.5rem] border border-[#1a1a1a]/[0.06] bg-white p-2 shadow-[0_28px_60px_-20px_rgba(26,26,26,0.35)]"
        >
          <p className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1a1a]/45">
            Notifications
          </p>

          {items.length === 0 ? (
            <p className="px-3 pb-4 pt-1 text-sm text-[#1a1a1a]/55">
              Nothing yet — a new message or a missed call will show up here.
            </p>
          ) : (
            <ul className="max-h-[22rem] space-y-0.5 overflow-y-auto">
              {items.map((n) => {
                const key = n.kind === 'message' ? `m:${n.otherId}` : `c:${n.id}`;
                const name = n.member?.name ?? 'Someone';
                return (
                  <li key={key}>
                    <Link
                      href={`/portal/chat?to=${n.otherId}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex min-h-[var(--bh-tap)] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#1a1a1a]/[0.05]"
                    >
                      <Face member={n.member} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-[#1a1a1a]">
                            {name}
                          </span>
                          <span className="shrink-0 text-[0.7rem] text-[#1a1a1a]/45">
                            {timeAgo(n.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#1a1a1a]/60">
                          {n.kind === 'call' ? (
                            <>
                              <Icon name="video" size={13} />
                              <span className="truncate">
                                {n.status === 'missed'
                                  ? 'Missed video call'
                                  : "Video call — you weren't available"}
                              </span>
                            </>
                          ) : (
                            <span className="truncate">
                              {n.preview}
                              {n.count > 1 ? ` (+${n.count - 1} more)` : ''}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
