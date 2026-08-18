'use client';

import { ConstellationCanvas } from '@/components/three';
import { LinkButton } from '@/components/ui/Button';
import { bridge, manifesto } from '@/lib/content';

/**
 * The close, and the argument for the whole charity.
 *
 * The scene used to sit in its own 14rem block above the words, where it
 * read as a small smudge marooned in a lot of black. It is now a
 * full-bleed atmosphere behind the section, masked at the edges — the
 * texture the dark ground was missing, rather than an object.
 *
 * The copy is a diptych: the two halves of the problem side by side with
 * the bridge drawn between them, then the resolution. Centre-stacking a
 * quote, a paragraph and two buttons is what made it feel like filler.
 */
export function ClosingSection() {
  return (
    <section id="why" className="relative overflow-hidden bg-night py-24 sm:py-28">
      {/* Atmosphere. `mask-image` fades it into the ground on every side,
          so there is no visible canvas edge to give the game away. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          maskImage:
            'radial-gradient(ellipse 75% 60% at 50% 42%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 82%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 60% at 50% 42%, #000 0%, rgba(0,0,0,0.5) 55%, transparent 82%)',
        }}
        aria-hidden="true"
      >
        <ConstellationCanvas className="h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <p className="reveal text-center text-xs font-bold tracking-[0.3em] text-gold">
          {manifesto.eyebrow}
        </p>

        <blockquote className="reveal mt-7" data-delay="80">
          <p className="mx-auto max-w-4xl text-balance text-center font-serif text-2xl font-normal italic leading-snug tracking-tight text-cream sm:text-4xl lg:text-5xl">
            {manifesto.quote}
          </p>
        </blockquote>

        {/* ------------------------------ The diptych ------------------------
            Two halves and the span between them. On a phone the connector
            turns vertical, because side-by-side at that width would give
            each column about twelve characters. */}
        <div className="reveal mt-16 sm:mt-20" data-delay="160">
          <div className="flex flex-col items-center gap-8 md:flex-row md:gap-6">
            <Half label={bridge.left.label} line={bridge.left.line} align="md:text-right" />

            {/* The bridge itself. */}
            <div
              className="flex items-center justify-center gap-3 md:flex-col"
              aria-hidden="true"
            >
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70 md:h-12 md:w-px md:bg-gradient-to-b" />
              <span className="h-2.5 w-2.5 shrink-0 rotate-45 border border-gold/80 bg-night" />
              <span className="h-px w-12 bg-gradient-to-r from-gold/70 to-transparent md:h-12 md:w-px md:bg-gradient-to-b md:from-gold/70 md:to-transparent" />
            </div>

            <Half label={bridge.right.label} line={bridge.right.line} align="md:text-left" />
          </div>

          <p className="mx-auto mt-14 max-w-2xl text-balance text-center text-lg leading-relaxed text-sage-soft">
            {bridge.join}
          </p>
        </div>

        <div className="reveal mt-12 flex flex-wrap justify-center gap-3" data-delay="220">
          <LinkButton href="/signup" variant="gold" size="lg">
            Start connecting
          </LinkButton>
          <LinkButton href="/portal/donate" variant="onDark" size="lg">
            Give to the build
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

function Half({
  label,
  line,
  align,
}: {
  label: string;
  line: string;
  align: string;
}) {
  return (
    <div className={`w-full text-center md:flex-1 ${align}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sage-soft/70">
        {label}
      </p>
      <p className="mt-3 font-serif text-2xl font-medium leading-snug text-cream sm:text-3xl">
        {line}
      </p>
    </div>
  );
}
