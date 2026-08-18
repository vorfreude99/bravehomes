'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHead, useSessionUser } from './PortalShell';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { LinkButton } from '@/components/ui/Button';
import { listMembers, listMessages, type Member } from '@/lib/db';
import { projects, steps } from '@/lib/content';
import { Icon, type IconName } from '@/components/ui/Icon';

const QUICK = [
  {
    href: '/portal/find',
    icon: 'search' as IconName,
    title: 'Find someone to talk to',
    body: 'Browse people who are looking for a conversation right now.',
  },
  {
    href: '/portal/chat',
    icon: 'chat' as IconName,
    title: 'Open your chats',
    body: 'Pick up where you left off. Text, and soon voice and video.',
  },
  {
    href: '/portal/donate',
    icon: 'heart' as IconName,
    title: 'Lay a brick',
    body: 'Every penny goes to the build. Watch your wall grow.',
  },
];

export function PortalHome() {
  const me = useSessionUser();
  const [people, setPeople] = useState<Member[]>([]);
  const [unreadFrom, setUnreadFrom] = useState(0);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const [{ members }, { messages }] = await Promise.all([
        listMembers(me.id),
        listMessages(me.id),
      ]);
      if (!alive) return;

      setPeople(members.slice(0, 4));
      // How many people have written to you at all — a gentle nudge,
      // not a fake unread badge we can't actually track yet.
      setUnreadFrom(new Set(messages.filter((m) => m.recipient === me.id).map((m) => m.sender)).size);
    })();

    return () => {
      alive = false;
    };
  }, [me.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHead
        title={`${greeting}, ${me.name}`}
        subtitle={
          unreadFrom
            ? `${unreadFrom} ${unreadFrom === 1 ? 'person has' : 'people have'} written to you.`
            : 'Somebody out there would be glad to hear from you today.'
        }
        action={
          <LinkButton href="/portal/find" variant="primary">
            Find someone
          </LinkButton>
        }
      />

      <div className="space-y-14 px-5 py-10 sm:px-8">
        {/* Quick actions */}
        <section aria-labelledby="quick">
          <h2 id="quick" className="sr-only">
            Quick actions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="card grain group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sage"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-mist text-forest">
                  <Icon name={q.icon} size={22} />
                </span>
                <h3 className="mt-3 font-serif text-xl font-medium text-forest">
                  {q.title}
                </h3>
                <p className="mt-1.5 text-olive">{q.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* People */}
        <section aria-labelledby="people">
          <div className="flex items-end justify-between gap-4">
            <h2 id="people" className="font-serif text-2xl font-medium text-forest">
              People to meet
            </h2>
            <Link
              href="/portal/find"
              className="font-semibold text-forest underline underline-offset-4"
            >
              See everyone
            </Link>
          </div>

          {people.length === 0 ? (
            <p className="mt-4 text-olive">
              Nobody else has joined yet — you’re early. Invite someone you care
              about, and your first conversation is waiting.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {people.map((p) => (
                <li key={p.id} className="card-solid p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-mist text-lg font-bold text-forest">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <h3 className="mt-3 font-semibold text-forest">
                    {p.name}
                    {p.age ? `, ${p.age}` : ''}
                  </h3>
                  {p.city && <p className="text-sm text-ink-muted">{p.city}</p>}
                  {p.bio && (
                    <p className="mt-2 line-clamp-3 text-sm text-olive">{p.bio}</p>
                  )}
                  <Link
                    href={`/portal/chat?to=${p.id}`}
                    className="mt-4 inline-flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full bg-forest px-5 font-semibold text-cream"
                  >
                    Say hello
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Builds */}
        <section aria-labelledby="builds">
          <div className="flex items-end justify-between gap-4">
            <h2 id="builds" className="font-serif text-2xl font-medium text-forest">
              What your giving is building
            </h2>
            <Link
              href="/portal/homes"
              className="font-semibold text-forest underline underline-offset-4"
            >
              All homes
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>

        {/* How it works, for anyone still finding their feet */}
        <section aria-labelledby="how" className="card-solid p-7">
          <h2 id="how" className="font-serif text-2xl font-medium text-forest">
            New here? It’s just four steps.
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.id} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-mist text-forest">
                  <Icon name={s.icon} size={20} />
                </span>
                <span>
                  <span className="block font-semibold text-forest">
                    {i + 1}. {s.title}
                  </span>
                  <span className="text-sm text-olive">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
