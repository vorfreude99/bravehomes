'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSessionUser } from './PortalShell';
import { getProfile, listMembers, listMessages, type Member, type Message } from '@/lib/db';
import { Icon, type IconName } from '@/components/ui/Icon';

const INK = '#1a1a1a';
const YELLOW = '#f5d64e';


/** A number that counts up to its value — the dashboard waking up. */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

function Tile({
  className = '',
  delay,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    // `min-w-0`: a grid item's default minimum width is its content's own
    // (unwrapped) size, not the track's — so a long, un-truncatable-until-
    // rendered string (a test account's email standing in for a name, say)
    // could force this tile, and the whole row, wider than the phone
    // screen. `min-w-0` lets the grid track actually win, which is what
    // makes `truncate` further down able to do anything at all.
    <div
      className={`tile-in tile-hover min-w-0 rounded-[1.5rem] bg-white/75 p-5 ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** The small arrow button in the corner of the reference's tiles. */
function Corner({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1a1a1a]/15 text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
    >
      <span aria-hidden="true" className="corner-nudge text-sm">
        ↗
      </span>
    </Link>
  );
}

export function PortalHome() {
  const me = useSessionUser();
  const [people, setPeople] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Member | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [{ members }, { messages: msgs }, mine] = await Promise.all([
        listMembers(me.id),
        listMessages(me.id),
        getProfile(me.id),
      ]);
      if (!alive) return;
      setPeople(members);
      setMessages(msgs);
      setProfile(mine);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [me.id]);

  const firstName = me.name.split(' ')[0];
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    );
  }, []);
  const conversations = new Set(
    messages.map((m) => (m.sender === me.id ? m.recipient : m.sender)),
  ).size;
  const sent = messages.filter((m) => m.sender === me.id).length;

  /* Messages sent on each of the last seven days — the bar chart. */
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const key = day.toDateString();
    return {
      letter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day.getDay()],
      count: messages.filter(
        (m) => m.sender === me.id && new Date(m.created_at).toDateString() === key,
      ).length,
      today: i === 6,
    };
  });
  const busiest = Math.max(1, ...week.map((d) => d.count));

  const checklist: { label: string; done: boolean; href: string; icon: IconName }[] = [
    { label: 'Create your profile', done: Boolean(profile), href: '/portal/profile', icon: 'profile' },
    { label: 'Add a photo', done: Boolean(profile?.avatar_url), href: '/portal/profile', icon: 'profile' },
    { label: 'Say where you live', done: Boolean(profile?.city), href: '/portal/profile', icon: 'home' },
    { label: 'Write a line about yourself', done: Boolean(profile?.bio), href: '/portal/profile', icon: 'chat' },
    { label: 'Send a first message', done: sent > 0, href: '/portal/find', icon: 'mail' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const profilePct = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="px-5 pb-8 sm:px-8">
      {/* Sans, not the site's serif — the reference sets this in a plain
          grotesque, and the serif was the loudest tell that this was a
          different design wearing its layout. */}
      <h1 className="rise-in text-4xl font-medium tracking-tight text-[#1a1a1a] sm:text-[2.75rem]">
        Welcome in, {firstName}
      </h1>
      {today && (
        <p className="rise-in mt-1.5 text-sm text-[#1a1a1a]/55" style={{ animationDelay: '80ms' }}>
          {today} — somebody here would love to hear from you.
        </p>
      )}

      {/* --------------------------- Pills + figures -------------------------- */}
      <div className="rise-in mt-6 flex flex-wrap items-end gap-x-10 gap-y-6" style={{ animationDelay: '120ms' }}>
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <div>
            <p className="mb-1.5 text-xs text-[#1a1a1a]/60">Profile</p>
            <span className="flex h-9 items-center rounded-full bg-[#1a1a1a] px-4 text-sm font-semibold text-white">
              {profilePct}%
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[#1a1a1a]/60">Conversations</p>
            <span
              className="flex h-9 items-center rounded-full px-4 text-sm font-semibold text-[#1a1a1a]"
              style={{ background: YELLOW }}
            >
              {loaded ? conversations : '—'}
            </span>
          </div>

        </div>

        <div className="flex shrink-0 gap-8 sm:gap-12">
          {[
            { n: loaded ? people.length : '—', label: 'People', icon: 'profile' as IconName },
            { n: loaded ? conversations : '—', label: 'Chats', icon: 'chat' as IconName },
            { n: loaded ? sent : '—', label: 'Sent', icon: 'mail' as IconName },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[2.75rem] font-medium leading-none tracking-tight text-[#1a1a1a]">
                {typeof s.n === 'number' ? <CountUp value={s.n} /> : s.n}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#1a1a1a]/70">
                <Icon name={s.icon} size={13} />
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------- Row one ----------------------------- */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.1fr_1.1fr_1fr]">
        {/* Photo card */}
        <div
          className="tile-in tile-hover relative min-w-0 overflow-hidden rounded-[1.5rem] bg-[#1a1a1a]"
          style={{ animationDelay: '200ms' }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full min-h-[15rem] w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[15rem] items-center justify-center">
              <span className="initial-breathe text-6xl font-medium text-white/80">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div
            className="absolute inset-x-0 bottom-0 p-5"
            style={{
              background:
                'linear-gradient(to top, rgba(18,18,18,0.88) 0%, rgba(18,18,18,0) 100%)',
            }}
          >
            <p className="truncate text-lg font-semibold text-white">
              {profile?.name ?? me.name}
            </p>
          </div>
        </div>

        {/* Progress — bars */}
        <Tile delay={280}>
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Progress</h2>
            <Corner href="/portal/chat" label="Open your chats" />
          </div>

          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-medium tracking-tight text-[#1a1a1a]">{sent}</span>
            <span className="text-xs leading-tight text-[#1a1a1a]/70">
              messages
              <br />
              this week
            </span>
          </p>

          <div className="mt-4 flex h-24 items-end justify-between gap-2">
            {week.map((d, i) => (
              <span key={i} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={`${d.today ? 'bar-today' : 'bar-grow'} w-2 origin-bottom rounded-full`}
                  style={{
                    height: `${Math.max(8, (d.count / busiest) * 72)}px`,
                    background: d.today ? YELLOW : 'rgba(26,26,26,0.85)',
                    animationDelay: `${400 + i * 70}ms`,
                  }}
                />
                <span className="text-[0.65rem] text-[#1a1a1a]/60">{d.letter}</span>
              </span>
            ))}
          </div>
        </Tile>

        {/* The dial */}
        <Tile delay={360} className="flex flex-col">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">The promise</h2>
            <Corner href="/portal/donate" label="Give" />
          </div>

          <div className="relative mx-auto my-2 flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
              <g className="bezel-spin">
                {Array.from({ length: 60 }).map((_, i) => (
                  <line
                    key={i}
                    x1="75"
                    y1="8"
                    x2="75"
                    y2="14"
                    stroke="rgba(26,26,26,0.18)"
                    strokeWidth="1.5"
                    transform={`rotate(${i * 6} 75 75)`}
                  />
                ))}
              </g>
              <circle cx="75" cy="75" r="52" fill="none" stroke="rgba(26,26,26,0.10)" strokeWidth="13" />
              <circle
                className="dial-draw"
                cx="75"
                cy="75"
                r="52"
                fill="none"
                stroke={YELLOW}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={0}
                transform="rotate(-90 75 75)"
              />
            </svg>
            <span className="absolute text-center">
              <span className="block text-2xl font-medium tracking-tight text-[#1a1a1a]">
                100%
              </span>
              <span className="block text-[0.65rem] text-[#1a1a1a]/70">
                of every gift
              </span>
            </span>
          </div>

          <Link
            href="/portal/donate"
            className="mt-auto flex min-h-[var(--bh-tap)] items-center justify-center rounded-full text-sm font-semibold text-[#1a1a1a]"
            style={{ background: YELLOW }}
          >
            Give now
          </Link>
        </Tile>

        {/* The mission, stated honestly — no invented percentages. The
            money goes to helping care homes, and this tile says so. */}
        <Tile delay={440}>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">The mission</h2>

          <div className="mt-4 space-y-3">
            {[{ label: 'Helping care homes', state: 'Every donation', on: true }].map((row) => (
              <div
                key={row.label}
                className="flex flex-col items-start gap-2 rounded-xl bg-[#1a1a1a]/[0.04] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <span className="min-w-0 text-sm font-semibold text-[#1a1a1a]">
                  {row.label}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] ${
                    row.on ? 'chip-glow text-[#1a1a1a]' : 'bg-[#1a1a1a]/10 text-[#1a1a1a]/70'
                  }`}
                  style={row.on ? { background: YELLOW } : undefined}
                >
                  {row.state}
                </span>
              </div>
            ))}
          </div>
        </Tile>
      </div>

      {/* ------------------------------- Row two ----------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr_1.4fr]">
        <Tile delay={520} className="divide-y divide-[#1a1a1a]/10 !py-2">
          {[
            { label: 'Your profile', href: '/portal/profile' },
            { label: 'Find people', href: '/portal/find' },
            { label: 'Open your chats', href: '/portal/chat' },
            { label: 'Donate', href: '/portal/donate' },
          ].map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="flex min-h-[var(--bh-tap)] items-center justify-between px-1 text-sm font-semibold text-[#1a1a1a]"
            >
              {row.label}
              <span aria-hidden="true" className="text-[#1a1a1a]/50">
                ›
              </span>
            </Link>
          ))}
        </Tile>

        <Tile delay={600}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">People to meet</h2>
            <Link
              href="/portal/find"
              className="text-sm font-semibold text-[#1a1a1a] underline underline-offset-4"
            >
              See everyone
            </Link>
          </div>

          {!loaded ? (
            <p className="mt-4 text-sm text-[#1a1a1a]/70">Looking…</p>
          ) : people.length === 0 ? (
            <p className="mt-4 text-sm text-[#1a1a1a]/70">
              You are the first one here. Invite someone you care about.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#1a1a1a]/10">
              {people.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a]/10">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#1a1a1a]">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#1a1a1a]">
                      {p.name}
                    </span>
                    {p.city && (
                      <span className="block truncate text-xs text-[#1a1a1a]/70">{p.city}</span>
                    )}
                  </span>
                  <Link
                    href={`/portal/people/${p.id}`}
                    className="shrink-0 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-white"
                  >
                    See profile
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* The dark task tile */}
        <div
          className="tile-in tile-hover min-w-0 rounded-[1.5rem] bg-[#1a1a1a] p-5"
          style={{ animationDelay: '680ms' }}
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-white">Getting started</h2>
            <span className="text-xl font-medium text-white">
              {doneCount}/{checklist.length}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="checklist-fill h-full rounded-full"
              style={{
                width: `${Math.max(4, (doneCount / checklist.length) * 100)}%`,
                background: YELLOW,
              }}
            />
          </div>

          <ul className="mt-4 space-y-1">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/10"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
                    aria-hidden="true"
                  >
                    <Icon name={c.icon} size={15} />
                  </span>
                  <span
                    className={`flex-1 text-sm ${c.done ? 'strike text-white/60' : 'text-white'}`}
                  >
                    {c.label}
                  </span>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: c.done ? YELLOW : 'rgba(255,255,255,0.2)', color: INK }}
                    aria-hidden="true"
                  >
                    {c.done ? <Icon name="check" size={12} /> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
