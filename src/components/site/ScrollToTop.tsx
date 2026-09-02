'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Static pages start at the top, always.
 *
 * The router aligns a fresh route to its first element, which sits below
 * the header spacing — and it does so at an unpredictable moment after
 * hydration, later still on slow connections. So rather than race it
 * with timers, hold the top for a beat: a frame loop pins scroll to 0
 * for 350ms, then lets go. The user's own first gesture cancels it
 * immediately, so nobody ever fights the page for the scrollbar.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const started = performance.now();
    let raf = 0;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };

    const tick = () => {
      if (cancelled) return;
      // If the smooth-scroll engine is live it owns the scrollbar, and a
      // plain scrollTo becomes a one-second glide — tell it to jump.
      const lenis = (
        window as unknown as {
          __lenis?: { scrollTo: (y: number, o: object) => void };
        }
      ).__lenis;
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      if (performance.now() - started < 350) raf = requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, [pathname]);

  return null;
}
