'use client';

import dynamic from 'next/dynamic';
import { Stage } from './Stage';
import {
  ConstellationFallback,
  GlobeFallback,
  HeroAmbientFallback,
  HeroFallback,
  HeroPollenFallback,
} from './Fallbacks';
import type { GlobeMarker } from './GlobeScene';

/**
 * Scenes are code-split and client-only. three.js is ~600KB — it must
 * never block first paint, and it must never run during SSR.
 */
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
const ConstellationScene = dynamic(() => import('./ConstellationScene'), { ssr: false });
const GlobeScene = dynamic(() => import('./GlobeScene'), { ssr: false });
const GiveScene = dynamic(() => import('./GiveScene'), { ssr: false });

export type { GlobeMarker };

export function HeroCanvas({
  className = '',
  showIsland = true,
  showSky = true,
}: {
  className?: string;
  showIsland?: boolean;
  showSky?: boolean;
}) {
  // The fallback has to match what the canvas actually draws, or
  // reduced-motion users get a scene the others never see.
  const fallback = showIsland ? (
    <HeroFallback />
  ) : showSky ? (
    <HeroAmbientFallback />
  ) : (
    <HeroPollenFallback />
  );

  return (
    <Stage
      className={className}
      camera={{ position: [0, 2.2, 8.5], fov: 42 }}
      fallback={fallback}
    >
      <HeroScene showIsland={showIsland} showSky={showSky} />
    </Stage>
  );
}

export function ConstellationCanvas({ className = '' }: { className?: string }) {
  return (
    <Stage
      className={className}
      minTier="medium"
      camera={{ position: [0, 0, 9], fov: 45 }}
      fallback={<ConstellationFallback />}
    >
      <ConstellationScene />
    </Stage>
  );
}

export function GlobeCanvas({
  markers,
  className = '',
}: {
  markers: GlobeMarker[];
  className?: string;
}) {
  return (
    <Stage
      className={className}
      camera={{ position: [0, 0.8, 6.2], fov: 42 }}
      fallback={<GlobeFallback />}
    >
      <GlobeScene markers={markers} />
    </Stage>
  );
}

/**
 * The donate page's decorative layer: a floating heart and rising motes
 * over the photograph. Reduced-motion and low-tier devices get a single
 * still glow where the heart would hang, so nothing feels missing.
 */
export function GiveCanvas({ className = '' }: { className?: string }) {
  return (
    <Stage
      className={className}
      camera={{ position: [0, 0, 7], fov: 40 }}
      fallback={
        <span
          className="absolute left-[58%] top-[42%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(215,240,92,0.55) 0%, rgba(215,240,92,0) 70%)',
            filter: 'blur(6px)',
          }}
        />
      }
    >
      <GiveScene />
    </Stage>
  );
}
