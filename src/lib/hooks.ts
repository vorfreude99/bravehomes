'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * True once the user has asked the OS to reduce motion.
 *
 * Read synchronously on the client so the very first client render is
 * already correct — otherwise `usePerfTier` briefly resolves to a real
 * tier before this lands, and a canvas flashes in for one frame.
 * Safe against hydration mismatch: everything gated on this renders the
 * same fallback on the server and on the first client paint either way.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

/**
 * Tracks a media query. Starts false so the server and the first client
 * render agree — branch on it only after mount, or React will refuse to
 * patch up the mismatched markup.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/**
 * Adds `.is-in` to every `.reveal` inside the document once it scrolls
 * into view. One observer for the whole page rather than one per node.
 */
export function useRevealObserver() {
  useEffect(() => {
    document.documentElement.classList.add('js');

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.delay ?? 0);
          el.style.animationDelay = `${delay}ms`;
          el.classList.add('is-in');
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

export type PerfTier = 'high' | 'medium' | 'low' | 'off';

/**
 * Decides how much WebGL this device should be asked to do.
 *
 * `off` means render the static fallback: no WebGL context available,
 * or the user asked for reduced motion. We never spend a phone's
 * battery on decoration the user has already declined.
 *
 * Starts at 'off' deliberately. Guessing a tier and correcting it in an
 * effect would mount a WebGL context on the first paint for *every*
 * visitor — including the reduced-motion ones we then tear it down for.
 * Better to start dark and light up once we actually know.
 */
export function usePerfTier(): PerfTier {
  const reduced = useReducedMotion();
  const [tier, setTier] = useState<PerfTier>('off');

  useEffect(() => {
    if (reduced) {
      setTier('off');
      return;
    }

    // Probe for a real WebGL context before mounting a Canvas.
    let supported = false;
    try {
      const canvas = document.createElement('canvas');
      supported = Boolean(
        canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
      );
    } catch {
      supported = false;
    }

    if (!supported) {
      setTier('off');
      return;
    }

    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const narrow = window.innerWidth < 768;

    if (cores <= 4 || memory <= 4 || (coarse && narrow)) setTier('low');
    else if (cores >= 8 && memory >= 8 && !coarse) setTier('high');
    else setTier('medium');
  }, [reduced]);

  return tier;
}

/** Normalised pointer position (-1..1) with smoothing, for parallax. */
export function usePointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return pointer;
}

/** Counts up to `value` when the element enters view. */
export function useCountUp(value: number, duration = 1400) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutExpo
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, reduced]);

  return { display, setRef };
}
