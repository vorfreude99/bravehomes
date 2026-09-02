'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionUser } from './PortalShell';
import { useCalls } from './CallProvider';
import { getProfile, type Member } from '@/lib/db';
import { Icon } from '@/components/ui/Icon';

const YELLOW = '#f5d64e';

/**
 * One member's card, full page — what you see before you say hello.
 *
 * Deliberately the same dark card as the owner's own "how others see
 * you" preview, so what they were promised people would see is exactly
 * what people see.
 */
export function PersonClient({ id }: { id: string }) {
  const me = useSessionUser();
  const router = useRouter();
  const calls = useCalls();

  const [person, setPerson] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Your own face in this frame is just your profile — send them there.
  useEffect(() => {
    if (id === me.id) router.replace('/portal/profile');
  }, [id, me.id, router]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const profile = await getProfile(id);
      if (!alive) return;
      setPerson(profile);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <p className="px-5 py-16 text-center text-[#1a1a1a]/60">One moment…</p>;
  }

  if (!person) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-xl font-semibold text-[#1a1a1a]">
          We couldn’t find that person.
        </p>
        <p className="mt-2 text-[#1a1a1a]/60">
          They may have left, or the link may be old.
        </p>
        <Link
          href="/portal/find"
          className="mt-6 inline-flex min-h-[var(--bh-tap)] items-center rounded-full bg-[#1a1a1a] px-7 font-semibold text-white"
        >
          Meet everyone else
        </Link>
      </div>
    );
  }

  return (
    <div className="-mb-28 px-5 sm:px-8 lg:-mb-6">
      {/* Sized exactly like the chat panel — the one screen in the app
          proven to fit without scrolling. Photo one side, person the
          other, and everything they wrote clamped to what fits. */}
      <section
        className="grid h-[calc(100svh-9.5rem)] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] text-white lg:h-[calc(100svh-5.5rem)] lg:grid-cols-2 lg:grid-rows-1"
        style={{ background: '#1a1a1a' }}
      >
        {/* ------------------------------ photo ------------------------------ */}
        <div className="relative min-h-0">
          {person.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatar_url}
              alt={`${person.name}'s photo`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: YELLOW }}
            >
              <span className="text-8xl font-bold text-[#1a1a1a] sm:text-9xl">
                {person.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Real history, because people arrive here from Find, Chat and
              the dashboard alike. A fresh tab with no history falls back
              to Find rather than leaving the site. */}
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push('/portal/find');
            }}
            className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-[#1a1a1a]"
            style={{ background: 'rgba(26,26,26,0.55)' }}
          >
            <span aria-hidden="true">←</span> Back
          </button>
        </div>

        {/* ------------------------------- info ------------------------------- */}
        <div className="flex min-h-0 flex-col justify-center overflow-hidden p-5 sm:p-8 lg:p-12">
          <h1 className="truncate text-2xl font-medium tracking-tight sm:text-4xl">
            {person.name}
            {person.age ? `, ${person.age}` : ''}
          </h1>
          <p className="mt-1 truncate text-white/55">
            {person.city || 'Somewhere in the UK'}
          </p>

          {person.bio ? (
            <p className="mt-3 line-clamp-3 leading-relaxed text-white/80 sm:mt-5 sm:line-clamp-5">
              {person.bio}
            </p>
          ) : (
            <p className="mt-3 line-clamp-2 text-sm text-white/45 sm:mt-5">
              {person.name.split(' ')[0]} hasn’t written about themselves yet —
              a hello from you might be the reason they do.
            </p>
          )}

          {person.interests.length > 0 && (
            <div className="mt-4 hidden sm:mt-6 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                Likes talking about
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {person.interests.slice(0, 6).map((i) => (
                  <li
                    key={i}
                    className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[#1a1a1a]"
                    style={{ background: YELLOW }}
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex gap-3 sm:mt-8">
            <Link
              href={`/portal/chat?to=${person.id}`}
              className="flex min-h-[var(--bh-tap)] flex-1 items-center justify-center gap-2 rounded-full text-base font-bold text-[#1a1a1a] transition-transform hover:scale-[1.02] sm:min-h-14 sm:text-lg"
              style={{ background: YELLOW }}
            >
              <Icon name="chat" size={20} />
              Say hello
            </Link>
            {calls && (
              <button
                type="button"
                onClick={() => calls.call(person.id, person.name)}
                disabled={calls.busy}
                className="flex min-h-[var(--bh-tap)] flex-1 items-center justify-center gap-2 rounded-full border-2 border-white/25 text-base font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-[#1a1a1a] disabled:opacity-40 sm:min-h-14 sm:text-lg"
              >
                <Icon name="video" size={20} />
                Video call
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
