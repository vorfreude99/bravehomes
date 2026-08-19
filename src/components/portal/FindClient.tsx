'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHead, useSessionUser } from './PortalShell';
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
    <>
      <PageHead
        title="Find people"
        subtitle="Everyone here signed up hoping someone would say hello. You can be that someone."
      />

      <div className="px-5 pb-8 sm:px-8">
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

        {/* Rows, not a card grid. With one member the grid left a tall
            lonely box beside two empty columns, and a member with no bio
            or interests made that box mostly white space. A row reads
            the same whether there is one person or fifty, and whether
            they have filled anything in or not. */}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-4 rounded-[1.5rem] bg-white/75 p-5"
            >
              <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a]/[0.07]">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[#1a1a1a]">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#1a1a1a]">
                  {m.name}
                  {m.age ? `, ${m.age}` : ''}
                  {m.city ? (
                    <span className="text-base font-normal text-[#1a1a1a]/70">
                      {' '}· {m.city}
                    </span>
                  ) : null}
                </h2>

                {m.bio && (
                  <p className="mt-1 line-clamp-2 leading-relaxed text-[#1a1a1a]/70">{m.bio}</p>
                )}

                {m.interests?.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {m.interests.slice(0, 5).map((interest) => (
                      <li
                        key={interest}
                        className="rounded-full bg-[#1a1a1a]/[0.06] px-3 py-1 text-sm text-[#1a1a1a]/70"
                      >
                        {interest}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={`/portal/chat?to=${m.id}`}
                className="inline-flex min-h-[var(--bh-tap)] w-full shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] px-6 font-semibold text-white transition hover:bg-black sm:w-auto"
              >
                Start a conversation
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
