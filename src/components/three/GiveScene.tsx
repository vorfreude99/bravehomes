'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useDetail } from './Stage';

/**
 * The donate page's layer of weather.
 *
 * A small satin heart hangs in the air where the two photographed hands
 * are about to meet — the gift, mid-pass — while translucent motes rise
 * through the sky like dust caught in light. The whole scene leans a few
 * degrees with the pointer, which is what sells the depth; everything
 * else is deliberately quiet, because the photograph is the page.
 */

const LIME = '#f5d64e';

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.5);
  s.bezierCurveTo(0, 0.8, -0.4, 1.0, -0.7, 1.0);
  s.bezierCurveTo(-1.2, 1.0, -1.4, 0.6, -1.4, 0.35);
  s.bezierCurveTo(-1.4, -0.1, -1.0, -0.5, 0, -1.1);
  s.bezierCurveTo(1.0, -0.5, 1.4, -0.1, 1.4, 0.35);
  s.bezierCurveTo(1.4, 0.6, 1.2, 1.0, 0.7, 1.0);
  s.bezierCurveTo(0.4, 1.0, 0, 0.8, 0, 0.5);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.14,
    bevelSegments: 5,
    curveSegments: 24,
  });
  geo.center();
  return geo;
}

function Heart({
  scale,
  position,
  rotation = [0, 0, 0],
}: {
  scale: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const geo = useMemo(heartGeometry, []);
  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh geometry={geo} scale={scale} position={position} rotation={rotation}>
        <meshPhysicalMaterial
          color={LIME}
          roughness={0.22}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.25}
          sheen={0.6}
          sheenColor="#ffffff"
        />
      </mesh>
    </Float>
  );
}

/** Rising translucent motes — bokeh you can almost touch. */
function Motes() {
  const { scale } = useDetail();
  const count = Math.max(10, Math.round(30 * scale));
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 11,
        y: (Math.random() - 0.5) * 6,
        z: -2.5 + Math.random() * 4,
        r: 0.018 + Math.random() * 0.05,
        speed: 0.08 + Math.random() * 0.16,
        sway: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const inst = mesh.current;
    if (!inst) return;

    seeds.forEach((s, i) => {
      // Rise, wrap, and sway — modulo keeps every mote on a loop.
      const y = ((s.y + t * s.speed + 3) % 6) - 3;
      dummy.position.set(s.x + Math.sin(t * 0.4 + s.phase) * s.sway, y, s.z);
      dummy.scale.setScalar(s.r);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

export default function GiveScene() {
  const rig = useRef<THREE.Group>(null);

  // The parallax: the whole scene leans gently towards the pointer.
  useFrame(({ pointer }) => {
    const g = rig.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.x * 0.1, 0.04);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.06, 0.04);
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 5, 6]} intensity={1.4} />
      {/* Cool rim from the sky side, so the heart reads as lit by it. */}
      <directionalLight position={[-5, -2, 3]} intensity={0.5} color="#bcd2e8" />
      <pointLight position={[0.5, -0.2, 2.5]} intensity={2.2} color={LIME} distance={6} />

      <group ref={rig}>
        {/* A small charm hovering just above the fingertips — the gift,
            mid-pass — never covering the hands themselves. */}
        <Heart scale={0.2} position={[0.65, 0.85, 0.3]} rotation={[0.12, -0.4, 0.1]} />
        {/* And one far away, for depth. */}
        <Heart scale={0.09} position={[-3.4, 1.5, -1.8]} rotation={[0.05, 0.5, -0.12]} />
        <Motes />
      </group>
    </>
  );
}
