'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionUser } from './PortalShell';
import { Input, Notice } from '@/components/ui/Field';
import { listMembers, type Member } from '@/lib/db';

type AgeBand = 'all' | 'under-30' | '30-59' | '60-plus';

const BANDS: { id: AgeBand; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'under-30', label: 'Under 30' },
  { id: '30-59', label: '30 – 59' },
  { id: '60-plus', label: '60 and over' },
];

function inBand(age: number | null, band: AgeBand) {
  if (band === 'all') return true;
  if (age == null) return false;
  if (band === 'under-30') return age < 30;
  if (band === '30-59') return age >= 30 && age < 60;
  return age >= 60;
}

export function FindClient() {
  const me = useSessionUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<AgeBand>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const { members: list, error: listError } = await listMembers(me.id);
      if (!alive) return;
      if (listError) setError('We could not load members just now. Please try again.');
      setMembers(list);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [me.id]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (!inBand(m.age, band)) return false;
      if (!q) return true;
      return [m.name, m.city ?? '', m.bio ?? '', ...(m.interests ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, band]);

  // The drifting arc is a showcase for browsing everyone — once you've
  // actually narrowed the list down, motion works against you: you're
  // trying to read a short, specific set of matches, not idly watch faces
  // drift by. Any active filter drops straight to a plain, still grid.
  const isFiltered = band !== 'all' || query.trim() !== '';

  /**
   * Positions every card on the arc, once per frame.
   *
   * `p` runs -1 to 1 across the arc. x is linear so travel reads as
   * left-to-right; z and y are quadratic in p, which is what bends the
   * path away at both ends; the turn is linear so cards face the middle.
   */
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const host = stage.current;
    // The arc itself is `lg:`-only (see below) — no point running the
    // per-frame loop against a stage that's `display:none` on a phone.
    if (!host || results.length === 0 || isFiltered || window.innerWidth < 1024) return;

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = results.length;
    let raf = 0;
    let t = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // One full pass takes about a minute per card — slow enough to
      // read a name, not so slow that it looks broken.
      if (!pausedRef.current && !calm) t = (t + dt / (n * 9)) % 1;

      const half = host.clientWidth / 2 + 130;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const raw = (t + i / n) % 1;
        const p = raw * 2 - 1;
        const edge = Math.min(1, (1 - Math.abs(p)) * 4);

        el.style.transform =
          `translate3d(${p * half}px, ${Math.abs(p) * 46}px, ${-Math.abs(p) * 400}px)` +
          ` rotateY(${-p * 52}deg)`;
        el.style.opacity = String(edge);
        el.style.zIndex = String(100 - Math.round(Math.abs(p) * 100));
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [results.length, isFiltered]);

  return (
    <div className="px-5 pb-10 sm:px-8">
        <div className="mx-auto max-w-2xl pb-8 text-center">
          <h1 className="text-4xl font-medium tracking-tight text-[#1a1a1a] sm:text-5xl">
            Meet the people here
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[#1a1a1a]/70">
            Everyone here signed up hoping someone would say hello. You can be
            that someone.
          </p>
        </div>
        {/* Filters, in a tile — the page was a bare form on the ground
            while every other screen had moved to panels. */}
        <div className="flex flex-col gap-4 rounded-[1.5rem] bg-white/75 p-5 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-2 block font-semibold text-[#1a1a1a]">
              Search by name, city, or interest
            </span>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gardening, Manchester, chess…"
            />
          </label>

          <fieldset>
            <legend className="mb-2 font-semibold text-[#1a1a1a]">Age</legend>
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => {
                const active = band === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBand(b.id)}
                    aria-pressed={active}
                    className={`min-h-[var(--bh-tap)] rounded-full border-2 px-5 font-semibold transition ${
                      active
                        ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                        : 'border-[#1a1a1a]/15 bg-white text-[#1a1a1a]/70 hover:border-[#1a1a1a]/40'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {error && (
          <div className="mt-6">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        <p className="mt-6 text-sm text-[#1a1a1a]/60" role="status">
          {loading
            ? 'Looking…'
            : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}
        </p>

        {/* Results */}
        {!loading && results.length === 0 && !error && (
          <div className="mt-4 rounded-[1.5rem] bg-white/75 p-8 text-center">
            <h2 className="text-xl font-semibold text-[#1a1a1a]">
              {members.length === 0 ? 'You’re the first one here' : 'Nobody matches that yet'}
            </h2>
            <p className="mt-2 text-[#1a1a1a]/70">
              {members.length === 0
                ? 'As people join, they’ll show up here. Invite someone you think would love this.'
                : 'Try a broader search, or clear the age filter.'}
            </p>
          </div>
        )}

        {/* Filtered: a plain, still grid. Once you've narrowed the list
            down you're reading a short, specific set of matches, not
            idly watching faces drift by — motion works against that. */}
        {!loading && isFiltered && results.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((m) => (
              <li key={m.id}>
                <MemberCard member={m} compact />
              </li>
            ))}
          </ul>
        )}

        {/* Unfiltered + phone: a plain swipeable row instead of the arc.
            The arc's cards are absolutely positioned with a 3D transform
            sized for a wide desktop stage — pinned to a phone-width
            viewport they overlapped each other and ran off both edges.
            This is the same card at a size that actually fits, in a
            native horizontally-scrolling row a thumb can drag through. */}
        {!isFiltered && !loading && results.length > 0 && (
          <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:hidden">
            {results.map((m) => (
              <li key={m.id} className="w-44 shrink-0 snap-start">
                <MemberCard member={m} compact />
              </li>
            ))}
          </ul>
        )}

        {/* Unfiltered + desktop: an arc of faces, drifting slowly left to
            right.

            Each card's depth, lift and turn are all functions of how far
            along the arc it is, so the rank curves away at both ends and
            the middle comes to meet you. One rAF loop writes the
            transforms directly — no React state changes while it runs.

            It pauses whenever you point at it or tab into it. Asking
            someone to click a moving target would be unkind at the best
            of times, and this is an app for people in their eighties. */}
        {!isFiltered && (
          <div
            ref={stage}
            className="tilt-row relative mt-2 hidden h-[26rem] overflow-hidden lg:block"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <ul className="pointer-events-none absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {results.map((m, i) => (
                <li
                  key={m.id}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className="absolute left-1/2 top-1/2 -ml-[7.5rem] -mt-[10.5rem] w-[15rem]"
                >
                  <MemberCard member={m} className="pointer-events-auto" />
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

function cardGround(id: string) {
  const tint = [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
  return [
    'linear-gradient(160deg,#f5d64e 0%,#e7d79a 100%)',
    'linear-gradient(160deg,#d9dfd4 0%,#f1f0ea 100%)',
    'linear-gradient(160deg,#e6dcc6 0%,#f6f1e3 100%)',
    'linear-gradient(160deg,#d6dce4 0%,#eceff2 100%)',
  ][tint];
}

function MemberCard({
  member: m,
  className = '',
  compact = false,
}: {
  member: Member;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/portal/people/${m.id}`}
      className={`arc-card group relative block w-full overflow-hidden rounded-[1.5rem] outline-none ring-[#1a1a1a] focus-visible:ring-2 ${
        compact ? 'aspect-4/5 lg:aspect-auto lg:h-[21rem] lg:max-w-[15rem]' : 'h-[21rem] max-w-[15rem]'
      } ${className}`}
      style={{ background: cardGround(m.id) }}
    >
      {m.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-medium text-[#1a1a1a]/35 ${
            compact ? 'text-5xl lg:text-7xl' : 'text-7xl'
          }`}
        >
          {m.name.charAt(0).toUpperCase()}
        </span>
      )}

      <span
        className={`absolute inset-x-2 bottom-2 block rounded-2xl bg-white/85 backdrop-blur transition-colors duration-500 group-hover:bg-white ${
          compact ? 'px-3 py-2 lg:px-4 lg:py-3' : 'px-4 py-3'
        }`}
      >
        <span className="block truncate text-sm font-semibold text-[#1a1a1a]">
          {m.name}
          {m.age ? `, ${m.age}` : ''}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#1a1a1a]/60">
          {m.city || 'Somewhere in the UK'}
        </span>
        <span
          className={`mt-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#1a1a1a] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 ${
            compact ? 'hidden lg:block' : ''
          }`}
        >
          See their profile →
        </span>
      </span>
    </Link>
  );
}
