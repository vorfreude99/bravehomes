import Link from 'next/link';
import { brand, registration, values } from '@/lib/content';
import { BrandLock } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';

/**
 * Grouped by what someone is actually trying to do, rather than one
 * undifferentiated row of links. The old footer was a centred stack of
 * pills — every item the same shape and weight, so nothing led.
 */
const COLUMNS = [
  {
    heading: 'Brave Homes',
    links: [
      { href: '/#how', label: 'How it works' },
      { href: '/#why', label: 'Why we exist' },
      { href: '/about', label: 'About us' },
    ],
  },
  {
    heading: 'Get involved',
    links: [
      { href: '/signup', label: 'Join free' },
      { href: '/portal/donate', label: 'Donate' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'Contact',
    links: [{ href: '/contact', label: 'Contact us' }],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sage/25 bg-cream-deep/50">
      <div className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* ----------------------------- Identity ---------------------------- */}
          <div className="sm:col-span-3 lg:col-span-1">
            <BrandLock size={40} showTagline={false} />
            <p className="mt-4 max-w-xs leading-relaxed text-olive">
              {brand.footerLine}
            </p>

            {/* The promise the whole charity rests on. It was a pill among
                other pills; on its own, with a rule, it reads as a
                commitment rather than a tag. */}
            <p className="mt-7 flex items-center gap-2.5 border-l-2 border-gold pl-4 text-sm font-semibold text-forest">
              <Icon name="heart" size={16} className="shrink-0 text-gold-ink" />
              100% of every donation goes to the cause
            </p>

            {/* The values, said once and quietly. */}
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-sage-ink">
              {values.map((v) => v.label).join(' · ')}
            </p>
          </div>

          {/* ------------------------------ Links ------------------------------ */}
          {/* First two groups keep sitting side by side even on the
              narrowest phones — `sm:contents` dissolves this wrapper once
              the outer grid grows its own columns, so nothing doubles up.
              "Contact & legal" stays a plain sibling below, so on mobile
              (where the outer grid is one column) it lands full-width with
              its own divider instead of stranded next to empty space. */}
          <div className="grid grid-cols-2 gap-x-6 sm:contents">
            {COLUMNS.slice(0, 2).map((column) => (
              <FooterNav key={column.heading} column={column} />
            ))}
          </div>
          <FooterNav
            column={COLUMNS[2]}
            className="border-t border-sage/20 pt-8 sm:border-0 sm:pt-0"
          />
        </div>

        {/* ------------------------------ Small print ------------------------- */}
        <div className="mt-14 flex flex-col gap-4 border-t border-sage/25 pt-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}.
          </p>

          {/* Printed only once the real details exist — see `registration`
              in lib/content.ts. A made-up charity number on a page asking
              for money would be worse than no line at all. */}
          {registration.charityNumber && (
            <p>
              {registration.registeredName ?? brand.name} is a registered
              charity in England and Wales, no. {registration.charityNumber}
              {registration.registeredOffice
                ? `. Registered office: ${registration.registeredOffice}.`
                : '.'}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  column,
  className = '',
}: {
  column: (typeof COLUMNS)[number];
  className?: string;
}) {
  return (
    <nav aria-label={column.heading} className={className}>
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
        {column.heading}
      </h2>
      <ul className="mt-5 space-y-1">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="-mx-2 flex min-h-[var(--bh-tap)] items-center rounded-lg px-2 text-olive transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
