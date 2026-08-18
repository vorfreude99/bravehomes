'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandLock } from '@/components/ui/Brand';
import { LinkButton } from '@/components/ui/Button';
import { SimpleModeToggle } from '@/components/SettingsProvider';

/** Root-relative so the links still work from /about, /privacy, /contact. */
const NAV = [
  { id: 'how', href: '/#how', label: 'How it works' },
  { id: 'homes', href: '/#homes', label: 'The homes' },
  { id: 'why', href: '/#why', label: 'Why we exist' },
];

/**
 * `overlay` is for pages whose hero is a dark full-bleed photograph.
 * The header floats over it in light type until the user scrolls, then
 * settles onto the usual cream bar — without it the whole nav is dark
 * green on a dark photo and effectively invisible.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [marker, setMarker] = useState<{ left: number; width: number } | null>(null);

  // The bar changes height when it compacts on scroll, so the mobile
  // sheet has to be told where the bar actually ends rather than assume.
  const bar = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [barHeight, setBarHeight] = useState(72);

  /* --------------------------- scroll state --------------------------- */
  useEffect(() => {
    let raf = 0;

    const measure = () => {
      setScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* ------------------------ which section you're in ------------------------ */
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // A band across the middle of the screen: whichever section is
      // crossing it is the one you're reading.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* --------------------- slide the marker to the active link -------------- */
  const positionMarker = useCallback(() => {
    const el = active ? links.current[active] : null;
    if (!el) {
      setMarker(null);
      return;
    }
    setMarker({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  useLayoutEffect(() => {
    positionMarker();
  }, [positionMarker]);

  useEffect(() => {
    window.addEventListener('resize', positionMarker);
    return () => window.removeEventListener('resize', positionMarker);
  }, [positionMarker]);

  /**
   * Easy View changes the root font size, so every link gets wider —
   * but that fires no resize event, and the marker was left sitting at
   * the old link's coordinates. Watching the nav itself catches it.
   */
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const ro = new ResizeObserver(positionMarker);
    ro.observe(el);
    for (const link of Object.values(links.current)) if (link) ro.observe(link);
    return () => ro.disconnect();
  }, [positionMarker]);

  /* ------------- measure the bar, and publish it to the page -------------
     `--bh-header` is what every sticky element below uses to clear the
     header. A ResizeObserver rather than a resize listener, because the
     bar also grows when Easy View scales the type — which fires no
     resize event at all. */
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setBarHeight(h);
      document.documentElement.style.setProperty('--bh-header', `${Math.round(h)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrolled]);

  /* ----------------------------- mobile menu ----------------------------- */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // An open menu always needs its own solid ground.
  const onPhoto = overlay && !scrolled && !open;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'border-b border-forest/10 bg-white/85 shadow-[0_6px_24px_-18px_rgba(47,58,35,0.45)] backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent'
      }`}
    >
      {/* Scrim so the light type has something to sit on before scroll. */}
      {onPhoto && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-forest-deep/70 to-transparent"
          aria-hidden="true"
        />
      )}

      <div
        ref={bar}
        className={`relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 transition-all duration-300 sm:gap-6 sm:px-8 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        <BrandLock light={onPhoto} priority showTagline={false} size={scrolled ? 32 : 36} />

        {/* The nav sits in its own track. Loose in the bar it read as one
            undifferentiated row of six items with the utilities beside it;
            the track says "these four are the site, the rest are actions".
            `ring` rather than `border` so the padding box still starts at
            the border box — the marker is positioned from `offsetLeft`,
            which a border would shift by a pixel. */}
        <nav
          ref={nav}
          data-main-nav
          aria-label="Main"
          className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full p-1 ring-1 transition-colors duration-300 xl:flex ${
            onPhoto ? 'bg-cream/10 ring-cream/20' : 'bg-forest/[0.045] ring-forest/[0.07]'
          }`}
        >
          {/* The marker sits behind the links and glides between them. */}
          {marker && (
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 rounded-full transition-all duration-500 ${
                onPhoto
                  ? 'bg-cream/90'
                  : 'bg-white ring-1 ring-gold/60 shadow-[0_1px_2px_rgba(47,58,35,0.10),0_4px_10px_-6px_rgba(47,58,35,0.35)]'
              }`}
              style={{
                left: marker.left,
                width: marker.width,
                transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          )}

          {NAV.map((item) => {
            const on = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                ref={(el) => {
                  links.current[item.id] = el;
                }}
                aria-current={on ? 'true' : undefined}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  onPhoto
                    ? on
                      ? 'text-forest-deep'
                      : 'text-cream/85 hover:text-cream'
                    : on
                      ? 'text-forest'
                      : 'text-olive hover:text-forest'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Wrapped rather than given a `hidden` class: the toggle sets its
              own `inline-flex`, which would win on display in source order. */}
          <span className="hidden items-center gap-1 sm:flex">
            <SimpleModeToggle className="!border-transparent !bg-transparent !shadow-none !text-olive hover:!bg-sage-mist/50 hover:!text-forest" />
            <LinkButton href="/login" variant={onPhoto ? 'onDark' : 'ghost'}>
              Sign in
            </LinkButton>
            <span
              className={`ml-2 mr-1 h-5 w-px ${onPhoto ? 'bg-cream/25' : 'bg-forest/[0.13]'}`}
              aria-hidden="true"
            />
          </span>
          <LinkButton
            href="/signup"
            variant={onPhoto ? 'gold' : 'primary'}
            className="px-4 sm:px-6"
          >
            Join free
          </LinkButton>

          <button
            type="button"
            data-nav-toggle
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors xl:hidden ${
              onPhoto ? 'border-cream/40 text-cream' : 'border-sage/40 text-forest'
            }`}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d={open ? 'M4 4 L16 16 M16 4 L4 16' : 'M3 6h14 M3 10h14 M3 14h14'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* How far through the page you are. Decorative — the scrollbar
          already carries this for anyone who needs it. */}
      <div
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gold"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0.005 ? 0.85 : 0 }}
        aria-hidden="true"
      />

    </header>

      {/* --------------------------- Mobile menu ---------------------------
          A sibling of the header, not a child. The bar carries
          `backdrop-filter`, and an element with a backdrop-filter becomes
          the containing block for its fixed-position descendants — nested
          inside, this sheet resolved `bottom: 0` against the 73px bar and
          collapsed instead of covering the screen. */}
      {open && (
        <div
          id="mobile-nav"
          data-nav-sheet
          className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-cream px-5 pb-10 pt-4 xl:hidden"
          style={{ top: barHeight }}
        >
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {NAV.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rise-in flex min-h-[var(--bh-tap)] items-center justify-between rounded-2xl border border-sage/25 bg-parchment px-5 py-4 text-xl font-semibold text-forest"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {item.label}
                <span aria-hidden="true" className="text-sage">
                  →
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 grid gap-3">
            <LinkButton
              href="/signup"
              variant="primary"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Join free — takes a minute
            </LinkButton>
            <LinkButton
              href="/login"
              variant="secondary"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Sign in
            </LinkButton>
          </div>

          <SimpleModeToggle className="mt-6 w-full justify-center" />
        </div>
      )}
    </>
  );
}
