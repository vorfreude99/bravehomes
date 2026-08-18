'use client';

import Link from 'next/link';
import { currency, type Project } from '@/lib/content';
import { useCountUp } from '@/lib/hooks';
import { Flag } from './Flag';

/**
 * A funding meter. The bar is decorative; the numbers beside it are the
 * accessible source of truth, and the whole thing carries a progressbar
 * role so screen readers get the percentage without reading the SVG.
 */
export function ProjectCard({ project, href }: { project: Project; href?: string }) {
  const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));
  const { display, setRef } = useCountUp(project.raised);

  const body = (
    <article className="card grain relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sage hover:shadow-[0_24px_50px_-30px_rgba(47,58,35,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Flag region={project.region} />
          <h3 className="mt-2 font-serif text-xl font-medium text-forest">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">{project.status}</p>
        </div>
        <span className="shrink-0 rounded-full bg-sage-mist px-3 py-1 text-sm font-bold text-forest">
          {pct}%
        </span>
      </div>

      <div
        className="mt-6 h-3 w-full overflow-hidden rounded-full bg-cream-deep"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.name} funding progress`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span ref={setRef} className="font-bold text-gold-ink">
          {currency.format(display)} raised
        </span>
        <span className="text-ink-muted">Goal: {currency.format(project.goal)}</span>
      </div>
    </article>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block rounded-[var(--bh-radius)]">
      {body}
    </Link>
  );
}
