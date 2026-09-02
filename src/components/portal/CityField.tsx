'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * A city picker that behaves like a patient assistant: start typing and
 * the world's cities appear beneath, UK first. It is an assist, not a
 * gate — any text is accepted, because somebody's village will always be
 * missing from any list.
 *
 * The 8,760-entry dataset (every UK town over 15k people, plus the
 * world's largest cities) loads lazily on first focus, so profiles that
 * never touch the field never pay for it.
 */

type City = [name: string, countryCode: string];

const region = new Intl.DisplayNames(['en'], { type: 'region' });

function countryName(cc: string) {
  try {
    return region.of(cc) ?? cc;
  } catch {
    return cc;
  }
}

export function CityField({
  id,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [cities, setCities] = useState<City[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  // Load the dataset once, on first focus.
  const load = () => {
    if (!cities) {
      void import('@/lib/cities.json').then((m) =>
        setCities(m.default as City[]),
      );
    }
  };

  const matches = useMemo(() => {
    if (!cities || value.trim().length < 2) return [];
    const q = value.trim().toLowerCase();
    const starts: City[] = [];
    const contains: City[] = [];
    for (const c of cities) {
      const n = c[0].toLowerCase();
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(q)) contains.push(c);
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }, [cities, value]);

  useEffect(() => setActive(0), [value]);

  // Close on any click outside.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const pick = (c: City) => {
    onChange(c[0]);
    setOpen(false);
  };

  const showing = open && matches.length > 0;

  return (
    <div ref={wrap} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={showing}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        value={value}
        disabled={disabled}
        placeholder="Start typing your city…"
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showing) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {showing && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white py-1.5 shadow-[0_24px_50px_-20px_rgba(26,26,26,0.35)]"
        >
          {matches.map((c, i) => (
            <li key={`${c[0]}-${c[1]}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                // Fires before blur, so the click never loses the race.
                onPointerDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === active ? 'bg-[#f5d64e]/40' : ''
                }`}
              >
                <span className="truncate font-semibold text-[#1a1a1a]">{c[0]}</span>
                <span className="shrink-0 text-xs text-[#1a1a1a]/55">
                  {countryName(c[1])}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
