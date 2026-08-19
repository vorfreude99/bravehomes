'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSessionUser } from './PortalShell';
import { LinkButton } from '@/components/ui/Button';
import { getProfile, listMembers, listMessages, type Member, type Message } from '@/lib/db';
import { BUILD_STAGES, currency, projects } from '@/lib/content';
import { Icon, type IconName } from '@/components/ui/Icon';

const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);
const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
const totalPct = Math.round((totalRaised / totalGoal) * 100);

/** Shared tile shell, so every panel sits on the same rounded ground. */
function Tile({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[1.75rem] bg-white/70 p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * A ring, drawn rather than filled: two circles and a dash offset. No
 * chart library for one number — it would be more bytes than the whole
 * dashboard.
 */
function Ring({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-[#1c1c1c]/10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          className="text-[#f5cf47]"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <span className="absolute text-center">
        <span className="block font-serif text-3xl font-medium text-[#1c1c1c]">{label}</span>
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#1c1c1c]/55">
          {sub}
        </span>
      </span>
    </div>
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = me.name.split(' ')[0];

  const conversations = new Set(
    messages.map((m) => (m.sender === me.id ? m.recipient : m.sender)),
  ).size;
  const sent = messages.filter((m) => m.sender === me.id).length;
  const wroteToMe = new Set(
    messages.filter((m) => m.recipient === me.id).map((m) => m.sender),
  ).size;

  /**
   * A real checklist, not a decorative one: every line is read from the
   * account, so it cannot claim progress that has not happened.
   */
  const checklist: { label: string; done: boolean; href: string; icon: IconName }[] = [
    { label: 'Create your profile', done: Boolean(profile), href: '/portal/profile', icon: 'profile' },
    { label: 'Say where you live', done: Boolean(profile?.city), href: '/portal/profile', icon: 'home' },
    { label: 'Write a line about yourself', done: Boolean(profile?.bio), href: '/portal/profile', icon: 'chat' },
    { label: 'Send a first message', done: sent > 0, href: '/portal/find', icon: 'mail' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="px-5 pb-14 pt-7 sm:px-8">
      {/* ------------------------------ Welcome ------------------------------ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1c1c1c]/55">
            {greeting}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium leading-none text-[#1c1c1c] sm:text-5xl">
            Welcome in, {firstName}
          </h1>
        </div>
        <LinkButton
          href="/portal/find"
          variant="primary"
          className="!bg-[#1c1c1c] !text-[#f4f3ef] !shadow-none hover:!bg-black"
        >
          Find someone
        </LinkButton>
      </div>

      {/* Headline figures. Every one is counted from the database, so an
          empty account honestly reads zero rather than showing a demo. */}
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { n: people.length, label: 'people here', icon: 'profile' as IconName },
          { n: conversations, label: 'conversations', icon: 'chat' as IconName },
          { n: wroteToMe, label: 'waiting on you', icon: 'mail' as IconName },
          { n: projects.length, label: 'homes under way', icon: 'home' as IconName },
        ].map((s) => (
          <Tile key={s.label} className="!p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c1c1c]/[0.06] text-[#1c1c1c]">
              <Icon name={s.icon} size={18} />
            </span>
            <p className="mt-3 font-serif text-4xl font-medium leading-none text-[#1c1c1c]">
              {loaded ? s.n : '—'}
            </p>
            <p className="mt-1 text-sm text-[#1c1c1c]/65">{s.label}</p>
          </Tile>
        ))}
      </div>

      {/* -------------------------------- Bento ------------------------------ */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* You */}
        <Tile className="flex flex-col justify-between bg-gradient-to-br from-[#f7efd0] to-white/70">
          <div>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1c1c1c] text-2xl font-bold text-[#f4f3ef]">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-medium text-[#1c1c1c]">
              {profile?.name ?? me.name}
            </h2>
            <p className="text-[#1c1c1c]/65">
              {profile?.city || 'Add your city so people nearby can find you'}
            </p>
          </div>
          <Link
            href="/portal/profile"
            className="mt-6 inline-flex min-h-[var(--bh-tap)] items-center justify-center rounded-full border-2 border-[#1c1c1c]/15 px-5 font-semibold text-[#1c1c1c] transition-colors hover:border-[#1c1c1c] hover:bg-white"
          >
            Edit your profile
          </Link>
        </Tile>

        {/* Giving */}
        <Tile className="flex flex-col items-center justify-center text-center">
          <h2 className="self-start font-serif text-xl font-medium text-[#1c1c1c]">
            The build so far
          </h2>
          <div className="my-3">
            <Ring pct={totalPct} label={`${totalPct}%`} sub="funded" />
          </div>
          <p className="text-[#1c1c1c]/65">
            <span className="font-semibold text-[#1c1c1c]">{currency.format(totalRaised)}</span> of{' '}
            {currency.format(totalGoal)}
          </p>
          <LinkButton
            href="/portal/donate"
            variant="gold"
            className="mt-4 w-full !bg-[#f5cf47] !text-[#1c1c1c] !shadow-none hover:!bg-[#f0c52d]"
          >
            Lay a brick
          </LinkButton>
        </Tile>

        {/* Getting started — the dark tile from the reference, earning its
            weight by carrying the one thing that changes per person. */}
        <Tile className="!border-[#1c1c1c] !bg-[#1c1c1c]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium text-[#f4f3ef]">Getting started</h2>
            <span className="font-serif text-2xl text-[#f5cf47]">
              {doneCount}/{checklist.length}
            </span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/10"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      c.done ? 'bg-[#f5cf47] text-[#1c1c1c]-deep' : 'bg-white/10 text-[#f4f3ef]/55'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon name={c.done ? 'check' : c.icon} size={17} />
                  </span>
                  <span
                    className={`text-sm ${
                      c.done ? 'text-[#f4f3ef]/55 line-through' : 'font-semibold text-[#f4f3ef]'
                    }`}
                  >
                    {c.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Tile>

        {/* People — spans two columns so a single member still fills a row */}
        <Tile className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-xl font-medium text-[#1c1c1c]">People to meet</h2>
            <Link
              href="/portal/find"
              className="text-sm font-semibold text-[#1c1c1c] underline underline-offset-4"
            >
              See everyone
            </Link>
          </div>

          {!loaded ? (
            <p className="mt-5 text-[#1c1c1c]/65">Looking for people…</p>
          ) : people.length === 0 ? (
            <p className="mt-5 text-[#1c1c1c]/65">
              You are the first one here. Invite someone you care about and your
              first conversation is waiting.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#1c1c1c]/10">
              {people.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1c1c1c]/[0.06] font-bold text-[#1c1c1c]">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#1c1c1c]">
                      {p.name}
                      {p.age ? `, ${p.age}` : ''}
                    </span>
                    {p.city && <span className="block text-sm text-[#1c1c1c]/65">{p.city}</span>}
                  </span>
                  <Link
                    href={`/portal/chat?to=${p.id}`}
                    className="inline-flex min-h-[var(--bh-tap)] shrink-0 items-center rounded-full bg-[#1c1c1c] px-5 text-sm font-semibold text-[#f4f3ef]"
                  >
                    Say hello
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* Builds */}
        <Tile>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-xl font-medium text-[#1c1c1c]">The homes</h2>
            <Link
              href="/portal/homes"
              className="text-sm font-semibold text-[#1c1c1c] underline underline-offset-4"
            >
              All
            </Link>
          </div>

          <ul className="mt-4 space-y-4">
            {projects.map((project) => {
              const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));
              return (
                <li key={project.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-[#1c1c1c]">
                      {project.name}
                    </span>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1c1c1c]/55">
                      {BUILD_STAGES[project.stage]}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1c1c1c]/10"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} funding progress`}
                  >
                    <div className="h-full rounded-full bg-[#f5cf47]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Tile>
      </div>
    </div>
  );
}
