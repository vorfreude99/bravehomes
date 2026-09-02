'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion, useRevealObserver } from '@/lib/hooks';

/**
 * Page-level motion: scroll-reveal for `.reveal` nodes plus inertial
 * smooth scrolling. Both switch off entirely under reduced-motion —
 * hijacking the scrollbar is exactly the wrong move for this audience.
 */
export function Reveal() {
  useRevealObserver();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ duration: 0.8, smoothWheel: true });
    // Published so route changes can jump instantly instead of gliding.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let raf = 0;

    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
