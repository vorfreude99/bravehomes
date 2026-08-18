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

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let raf = 0;

    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
