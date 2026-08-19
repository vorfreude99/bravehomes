'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
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

        {/* A person, not a row of fields.

            Most members have no bio, city or interests yet, so a card
            built only from those reads as a mostly-empty box. The cover
            band gives every card the same shape whether it is full or
            bare, and where there is nothing to say the card says the
            true thing — that they are new and waiting. */}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((m) => {
            // Stable per person, so a face keeps its colour between visits.
            const tint = [...m.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
            const cover = [
              'linear-gradient(135deg,#f5d64e 0%,#f0e3b0 100%)',
              'linear-gradient(135deg,#dfe4d8 0%,#f2f1ec 100%)',
              'linear-gradient(135deg,#e9dfc9 0%,#f7f2e4 100%)',
              'linear-gradient(135deg,#d8dee6 0%,#eef1f4 100%)',
            ][tint];

            return (
              <li
                key={m.id}
                className="overflow-hidden rounded-[1.5rem] bg-white/75 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(26,26,26,0.45)]"
              >
                <div className="h-20 w-full" style={{ background: cover }} aria-hidden="true" />

                <div className="-mt-9 px-5 pb-5">
                  <span className="flex h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border-4 border-white bg-[#1a1a1a]/[0.07]">
                    {m.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#1a1a1a]">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <h2 className="mt-3 truncate text-lg font-semibold text-[#1a1a1a]">
                    {m.name}
                    {m.age ? `, ${m.age}` : ''}
                  </h2>

                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#1a1a1a]/60">
                    <Icon name={m.city ? 'home' : 'profile'} size={14} />
                    {m.city || 'Somewhere in the UK'}
                  </p>

                  <p className="mt-3 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-[#1a1a1a]/70">
                    {m.bio || 'New here, and nobody has said hello yet.'}
                  </p>

                  <ul className="mt-3 flex min-h-[1.75rem] flex-wrap gap-1.5">
                    {(m.interests ?? []).slice(0, 3).map((interest) => (
                      <li
                        key={interest}
                        className="rounded-full bg-[#1a1a1a]/[0.06] px-2.5 py-1 text-xs font-medium text-[#1a1a1a]/70"
                      >
                        {interest}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/portal/chat?to=${m.id}`}
                    className="mt-4 inline-flex min-h-[var(--bh-tap)] w-full items-center justify-center rounded-full bg-[#1a1a1a] px-6 font-semibold text-white transition hover:bg-black"
                  >
                    Say hello
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
