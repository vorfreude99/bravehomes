'use client';

import { Canvas, type CanvasProps } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePerfTier, type PerfTier } from '@/lib/hooks';

const DPR: Record<Exclude<PerfTier, 'off'>, [number, number]> = {
  high: [1, 2],
  medium: [1, 1.6],
  low: [0.8, 1.2],
};

type StageProps = {
  children: ReactNode;
  /** Rendered instead of the canvas on low-capability or reduced-motion. */
  fallback: ReactNode;
  /** Lowest tier that still gets WebGL. Heavy scenes pass 'medium'. */
  minTier?: Exclude<PerfTier, 'off'>;
  className?: string;
  camera?: CanvasProps['camera'];
};

const RANK: Record<PerfTier, number> = { off: 0, low: 1, medium: 2, high: 3 };

/**
 * Every WebGL surface in the app goes through here.
 *
 * It guarantees three things the scenes themselves shouldn't have to
 * worry about: the canvas is decorative (aria-hidden), it never mounts
 * on a device that can't afford it, and DPR is clamped per tier so a
 * retina laptop doesn't quietly render 4x the pixels it needs to.
 */
export function Stage({
  children,
  fallback,
  minTier = 'low',
  className = '',
  camera,
}: StageProps) {
  const tier = usePerfTier();
  const enabled = RANK[tier] >= RANK[minTier];

  /**
   * Only run the render loop while the canvas is actually on screen.
   *
   * With `frameloop="always"` every scene on the page renders forever —
   * the globe, the wall and the constellation were all drawing at full
   * rate while the visitor was still reading the hero, competing for the
   * same frames as the hero's scroll animation.
   */
  const holder = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node || !enabled) return;

    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // A little margin either side so it is already running by the time
      // it scrolls into view, never popping in mid-frame.
      { rootMargin: '200px 0px 200px 0px', threshold: 0 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [enabled]);

  /**
   * One wrapper element, always — the fallback and the canvas swap
   * *inside* it.
   *
   * The tier resolves in an effect, so this component always renders
   * the fallback first and the canvas a tick later. If the two states
   * returned different root elements, anything holding a reference to
   * the first one would be left pointing at a detached node — which is
   * exactly what happened to the scroll-reveal observer: it registered
   * the fallback, the canvas replaced it, and the new element kept the
   * observer's starting `opacity: 0` forever.
   */
  return (
    <div ref={holder} className={className} aria-hidden="true">
      {enabled ? (
        <Canvas
          dpr={DPR[tier as Exclude<PerfTier, 'off'>]}
          camera={camera ?? { position: [0, 0, 6], fov: 40 }}
          gl={{
            antialias: tier !== 'low',
            alpha: true,
            powerPreference: 'high-performance',
          }}
          frameloop={onScreen ? 'always' : 'never'}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}

/** Tier-aware helper for scenes that want to scale their own detail. */
export function useDetail() {
  const tier = usePerfTier();
  return {
    tier,
    /** Particle counts, segment counts — anything O(n) in the scene. */
    scale: tier === 'high' ? 1 : tier === 'medium' ? 0.55 : 0.3,
    shadows: tier === 'high',
    postFx: tier === 'high',
  };
}
