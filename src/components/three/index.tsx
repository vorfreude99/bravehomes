'use client';

import dynamic from 'next/dynamic';
import { Stage } from './Stage';
import {
  BrickFallback,
  ConstellationFallback,
  GlobeFallback,
  HeroAmbientFallback,
  HeroFallback,
  HeroPollenFallback,
} from './Fallbacks';
import { bricksFor, POUNDS_PER_BRICK } from './brick-utils';
import type { GlobeMarker } from './GlobeScene';

/**
 * Scenes are code-split and client-only. three.js is ~600KB — it must
 * never block first paint, and it must never run during SSR.
 */
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
const ConstellationScene = dynamic(() => import('./ConstellationScene'), { ssr: false });
const GlobeScene = dynamic(() => import('./GlobeScene'), { ssr: false });
const BrickScene = dynamic(() => import('./BrickScene'), { ssr: false });

export { bricksFor, POUNDS_PER_BRICK };
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

export function BrickCanvas({
  amount,
  className = '',
}: {
  amount: number;
  className?: string;
}) {
  return (
    <Stage
      className={className}
      camera={{ position: [0, 0.55, 4.9], fov: 42 }}
      fallback={<BrickFallback bricks={bricksFor(amount)} />}
    >
      <BrickScene amount={amount} />
    </Stage>
  );
}
