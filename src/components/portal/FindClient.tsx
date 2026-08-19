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

      <div className="px-5 py-8 sm:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex-1">
            <span className="mb-2 block font-semibold text-forest">
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
            <legend className="mb-2 font-semibold text-forest">Age</legend>
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
                        ? 'border-sage bg-sage-mist/70 text-forest'
                        : 'border-sage/30 bg-parchment text-olive hover:border-sage'
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

        <p className="mt-6 text-sm text-ink-muted" role="status">
          {loading
            ? 'Looking…'
            : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}
        </p>

        {/* Results */}
        {!loading && results.length === 0 && !error && (
          <div className="card-solid mt-6 p-8 text-center">
            <h2 className=" font-serif text-2xl font-medium text-forest">
              {members.length === 0 ? 'You’re the first one here' : 'Nobody matches that yet'}
            </h2>
            <p className="mt-2 text-olive">
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
        <ul className="mt-4 divide-y divide-sage/20">
          {results.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-4 py-5 sm:flex-nowrap"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-mist text-xl font-bold text-forest">
                {m.name.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xl font-medium text-forest">
                  {m.name}
                  {m.age ? `, ${m.age}` : ''}
                  {m.city ? (
                    <span className="font-sans text-base font-normal text-olive">
                      {' '}· {m.city}
                    </span>
                  ) : null}
                </h2>

                {m.bio && (
                  <p className="mt-1 line-clamp-2 leading-relaxed text-olive">{m.bio}</p>
                )}

                {m.interests?.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {m.interests.slice(0, 5).map((interest) => (
                      <li
                        key={interest}
                        className="rounded-full bg-cream-deep px-3 py-1 text-sm text-olive"
                      >
                        {interest}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={`/portal/chat?to=${m.id}`}
                className="inline-flex min-h-[var(--bh-tap)] w-full shrink-0 items-center justify-center rounded-full bg-forest px-6 font-semibold text-cream transition hover:bg-forest-deep sm:w-auto"
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
