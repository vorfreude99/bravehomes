'use client';

import { useState } from 'react';
import { PageHead } from './PortalShell';
import { GlobeCanvas, type GlobeMarker } from '@/components/three';
import { LinkButton } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { currency, projects } from '@/lib/content';

const markers: GlobeMarker[] = projects.map((p) => ({
  id: p.id,
  lat: p.lat,
  lon: p.lon,
  progress: Math.min(1, p.raised / p.goal),
}));

export function HomesClient() {
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];
  const pct = Math.min(100, Math.round((selected.raised / selected.goal) * 100));
  const remaining = Math.max(0, selected.goal - selected.raised);

  return (
    <>
      <PageHead
        title="The homes"
        subtitle="Every one of these is a real building on real land. Follow them as they go up."
      />

      <div className="grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        <GlobeCanvas markers={markers} className="h-[24rem] w-full lg:sticky lg:top-8 lg:h-[30rem]" />

        <div>
          {/* Project switcher */}
          <div
            role="tablist"
            aria-label="Choose a home"
            className="flex flex-wrap gap-2"
          >
            {projects.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(p.id)}
                  className={`inline-flex min-h-[var(--bh-tap)] items-center gap-2 rounded-full border-2 px-5 text-left font-semibold transition ${
                    active
                      ? 'border-sage bg-sage-mist/70 text-forest'
                      : 'border-sage/30 bg-parchment text-olive hover:border-sage'
                  }`}
                >
                  <Flag region={p.region} size={22} />
                  {p.name.replace(/^.*— /, '')}
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <article className="card-solid mt-6 p-7">
            <Flag region={selected.region} size={38} />
            <h2 className="mt-2 font-serif text-3xl font-medium text-forest">
              {selected.name}
            </h2>
            <p className="mt-1 text-olive">{selected.status}</p>

            <div
              className="mt-7 h-4 w-full overflow-hidden rounded-full bg-cream-deep"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${selected.name} funding progress`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-ink-muted">Raised</dt>
                <dd className="font-serif text-2xl font-medium text-gold-deep">
                  {currency.format(selected.raised)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Goal</dt>
                <dd className="font-serif text-2xl font-medium text-forest">
                  {currency.format(selected.goal)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Still needed</dt>
                <dd className="font-serif text-2xl font-medium text-forest">
                  {currency.format(remaining)}
                </dd>
              </div>
            </dl>

            <LinkButton
              href={`/portal/donate?project=${selected.id}`}
              variant="gold"
              size="lg"
              className="mt-7 w-full"
            >
              Give to this home
            </LinkButton>

            <p className="mt-3 text-center text-sm font-semibold text-sage">
              ✓ 100% directly to the cause. Zero admin fees. Always.
            </p>
          </article>

          <p className="mt-6 text-sm text-ink-muted">
            Funding figures are updated by the Brave Homes team as money comes in
            and as each stage of the build completes.
          </p>
        </div>
      </div>
    </>
  );
}
