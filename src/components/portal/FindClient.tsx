'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useEffect, useMemo, useState } from 'react';
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

        {/* A rank of tall portraits rather than a grid of detail cards.

            Colour is the signal: everyone sits in greyscale until you
            point at them, and the one you are looking at comes to life.
            It also solves the thin-data problem — a face fills the card,
            so nothing is asked of a bio nobody has written. */}
        <ul className="no-bar -mx-5 mt-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
          {results.map((m) => {
            const tint = [...m.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
            const ground = [
              'linear-gradient(160deg,#f5d64e 0%,#e7d79a 100%)',
              'linear-gradient(160deg,#d9dfd4 0%,#f1f0ea 100%)',
              'linear-gradient(160deg,#e6dcc6 0%,#f6f1e3 100%)',
              'linear-gradient(160deg,#d6dce4 0%,#eceff2 100%)',
            ][tint];

            return (
              <li key={m.id} className="shrink-0 snap-start">
                <Link
                  href={`/portal/chat?to=${m.id}`}
                  className="group relative block h-[21rem] w-[15rem] overflow-hidden rounded-[1.5rem] outline-none ring-[#1a1a1a] transition-transform duration-500 hover:-translate-y-1.5 focus-visible:ring-2"
                  style={{ background: ground }}
                >
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0 group-focus-visible:grayscale-0"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-7xl font-medium text-[#1a1a1a]/35 transition-colors duration-500 group-hover:text-[#1a1a1a]/60">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  {/* Name plate, floating clear of the card's foot. */}
                  <span className="absolute inset-x-3 bottom-3 block rounded-2xl bg-white/85 px-4 py-3 backdrop-blur transition-colors duration-500 group-hover:bg-white">
                    <span className="block truncate text-sm font-semibold text-[#1a1a1a]">
                      {m.name}
                      {m.age ? `, ${m.age}` : ''}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#1a1a1a]/60">
                      {m.city || 'Somewhere in the UK'}
                    </span>
                    <span className="mt-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#1a1a1a] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                      Say hello →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
    </div>
  );
}
