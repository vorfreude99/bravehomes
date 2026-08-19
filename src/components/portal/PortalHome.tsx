'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSessionUser } from './PortalShell';
import { LinkButton } from '@/components/ui/Button';
import { listMembers, listMessages, type Member } from '@/lib/db';
import { BUILD_STAGES, currency, projects, steps } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';

const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);
const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);

export function PortalHome() {
  const me = useSessionUser();
  const [people, setPeople] = useState<Member[]>([]);
  const [wroteToMe, setWroteToMe] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const [{ members }, { messages }] = await Promise.all([
        listMembers(me.id),
        listMessages(me.id),
      ]);
      if (!alive) return;

      setPeople(members.slice(0, 6));
      // How many people have written to you at all — a gentle nudge, not
      // a fake unread badge we cannot actually track yet.
      setWroteToMe(
        new Set(messages.filter((m) => m.recipient === me.id).map((m) => m.sender)).size,
      );
      setLoaded(true);
    })();

    return () => {
      alive = false;
    };
  }, [me.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = me.name.split(' ')[0];

  return (
    <div className="px-5 pb-14 pt-8 sm:px-8">
      {/* ------------------------------ Welcome ------------------------------
          One panel with one job, rather than three identical cards each
          asking for equal attention. The product's whole purpose is to
          get somebody talking, so that is the button. */}
      <section className="relative overflow-hidden rounded-[var(--bh-radius)] border border-sage/30 bg-sage-mist px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 90% at 88% 10%, rgba(201,154,63,0.22) 0%, rgba(237,241,232,0) 62%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sage-ink">
            {greeting}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.05] text-forest sm:text-5xl">
            {firstName}.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-olive">
            {wroteToMe
              ? `${wroteToMe} ${wroteToMe === 1 ? 'person has' : 'people have'} written to you. They are waiting on a reply.`
              : 'Somebody out there would be glad to hear from you today. It only takes one message to start.'}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {wroteToMe ? (
              <>
                <LinkButton href="/portal/chat" variant="primary" size="lg">
                  Read your messages
                </LinkButton>
                <LinkButton href="/portal/find" variant="secondary" size="lg">
                  Meet someone new
                </LinkButton>
              </>
            ) : (
              <>
                <LinkButton href="/portal/find" variant="primary" size="lg">
                  Find someone to talk to
                </LinkButton>
                <LinkButton href="/portal/chat" variant="secondary" size="lg">
                  Open your chats
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------- People ------------------------------ */}
      <section aria-labelledby="people" className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-sage/25 pb-3">
          <h2 id="people" className="font-serif text-2xl font-medium text-forest">
            People to meet
          </h2>
          <Link
            href="/portal/find"
            className="inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
          >
            See everyone
          </Link>
        </div>

        {!loaded ? (
          <p className="mt-6 text-olive">Looking for people…</p>
        ) : people.length === 0 ? (
          <div className="mt-6 rounded-[var(--bh-radius)] border border-dashed border-sage/40 p-8 text-center">
            <p className="font-serif text-xl text-forest">You are the first one here.</p>
            <p className="mx-auto mt-2 max-w-md text-olive">
              Nobody else has joined yet. Invite someone you care about and your
              first conversation is waiting.
            </p>
          </div>
        ) : (
          /* Rows, not a card grid. One member in a four-column grid left a
             lonely box beside three empty columns; a list reads the same
             with one person or twenty. */
          <ul className="mt-2 divide-y divide-sage/20">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-mist text-lg font-bold text-forest">
                  {p.name.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-forest">
                    {p.name}
                    {p.age ? `, ${p.age}` : ''}
                    {p.city ? <span className="font-normal text-olive"> · {p.city}</span> : null}
                  </span>
                  {p.bio && (
                    <span className="mt-0.5 block truncate text-sm text-olive">{p.bio}</span>
                  )}
                </span>

                <Link
                  href={`/portal/chat?to=${p.id}`}
                  className="inline-flex min-h-[var(--bh-tap)] shrink-0 items-center rounded-full border-2 border-sage/40 px-5 font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-mist/60"
                >
                  Say hello
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------- Builds ------------------------------
          The same register the public site uses, rather than three cards
          with percentage badges — that pattern was replaced out there for
          reading as a generic dashboard, and it would read the same here. */}
      <section aria-labelledby="builds" className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-sage/25 pb-3">
          <h2 id="builds" className="font-serif text-2xl font-medium text-forest">
            What your giving is building
          </h2>
          <Link
            href="/portal/homes"
            className="inline-flex min-h-[var(--bh-tap)] items-center font-semibold text-forest underline underline-offset-4"
          >
            All homes
          </Link>
        </div>

        <p className="mt-4 text-olive">
          <span className="font-serif text-2xl font-medium text-forest">
            {currency.format(totalRaised)}
          </span>{' '}
          raised of {currency.format(totalGoal)} across {projects.length} builds.
        </p>

        <ul className="mt-4 divide-y divide-sage/20">
          {projects.map((project) => {
            const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));
            return (
              <li key={project.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="font-semibold text-forest">{project.name}</span>
                  <span className="text-sm text-olive">
                    <span className="font-semibold text-gold-ink">
                      {currency.format(project.raised)}
                    </span>{' '}
                    of {currency.format(project.goal)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="h-px flex-1 bg-forest/12"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} funding progress`}
                  >
                    <span className="block h-px bg-gold" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-sage-ink">
                    {BUILD_STAGES[project.stage]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------ New here ----------------------------- */}
      <section aria-labelledby="how" className="mt-14">
        <h2
          id="how"
          className="border-b border-sage/25 pb-3 font-serif text-2xl font-medium text-forest"
        >
          New here? It’s just four steps.
        </h2>
        <ol className="mt-2 divide-y divide-sage/20">
          {steps.map((s, i) => (
            <li key={s.id} className="flex gap-4 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-mist text-forest">
                <Icon name={s.icon} size={20} />
              </span>
              <span>
                <span className="block font-semibold text-forest">
                  {i + 1}. {s.title}
                </span>
                <span className="text-sm leading-relaxed text-olive">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
