'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  constellationFrag,
  constellationVert,
  linkFrag,
  linkVert,
} from './shaders';
import { useDetail } from './Stage';

// Both clusters sit on the deep forest panel, so both need to out-value
// it. Sage (#7f9068) is only a shade off the background and disappeared
// entirely — the younger cluster reads in near-cream instead.
const YOUNG = new THREE.Color('#edf1e8');
const ELDER = new THREE.Color('#c99a3f');
const LINK = new THREE.Color('#c2d3a8');

function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Two clusters of people, drifting in their own orbits. */
function Clusters({ count, mix }: { count: number; mix: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const group = new Float32Array(count);
    const seed = new Float32Array(count);
    const rand = makeRandom(4242);

    for (let i = 0; i < count; i++) {
      const isElder = i % 2 === 1;
      const centre = isElder ? -2.4 : 2.4;

      // Spherical shell, denser toward the centre of each cluster.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 1.5 * Math.cbrt(rand());

      pos[i * 3] = centre + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      group[i] = isElder ? 1 : 0;
      seed[i] = rand();
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aGroup', new THREE.BufferAttribute(group, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
      uPixelRatio: { value: 1 },
      uYoung: { value: YOUNG.clone() },
      uElder: { value: ELDER.clone() },
    }),
    [],
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uMix.value = mix.current ?? 0;
    mat.current.uniforms.uPixelRatio.value = viewport.dpr;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={constellationVert}
        fragmentShader={constellationFrag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * The bridge itself: arcs from one cluster to the other with a pulse
 * of light travelling along each — a message crossing the gap.
 */
function Links({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const SAMPLES = 24;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const segs = SAMPLES - 1;
    const pos = new Float32Array(count * segs * 2 * 3);
    const progress = new Float32Array(count * segs * 2);
    const seed = new Float32Array(count * segs * 2);
    const rand = makeRandom(8888);

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const ctrl = new THREE.Vector3();
    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();

    let vi = 0;
    let ai = 0;

    for (let c = 0; c < count; c++) {
      const s = rand();

      a.set(2.4 + (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6);
      b.set(-2.4 + (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6);

      // Bow the midpoint away from the straight line so links arc over the
      // gap rather than cut it. Alternating the direction matters: bowing
      // every arc upward stacks the whole scene into the top of the frame.
      ctrl.copy(a).add(b).multiplyScalar(0.5);
      ctrl.y += (c % 2 === 0 ? 1 : -1) * (0.5 + rand() * 1.0);
      ctrl.z += (rand() - 0.5) * 1.5;

      const at = (t: number, out: THREE.Vector3) => {
        const inv = 1 - t;
        out.set(
          inv * inv * a.x + 2 * inv * t * ctrl.x + t * t * b.x,
          inv * inv * a.y + 2 * inv * t * ctrl.y + t * t * b.y,
          inv * inv * a.z + 2 * inv * t * ctrl.z + t * t * b.z,
        );
        return out;
      };

      for (let i = 0; i < segs; i++) {
        const t0 = i / segs;
        const t1 = (i + 1) / segs;
        at(t0, p0);
        at(t1, p1);

        pos[vi++] = p0.x;
        pos[vi++] = p0.y;
        pos[vi++] = p0.z;
        pos[vi++] = p1.x;
        pos[vi++] = p1.y;
        pos[vi++] = p1.z;

        progress[ai] = t0;
        seed[ai] = s;
        ai++;
        progress[ai] = t1;
        seed[ai] = s;
        ai++;
      }
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: LINK.clone() },
      uOpacity: { value: 0.9 },
    }),
    [],
  );

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={linkVert}
        fragmentShader={linkFrag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/** Slow orbit so the bridge is read from changing angles. */
function Orbit({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();

  /**
   * The clusters span roughly ±4 units horizontally. In a tall, narrow
   * panel (the sign-in aside) the horizontal field of view is the binding
   * constraint, so scale the whole scene down to fit rather than letting
   * half the bridge fall off the edges.
   */
  const aspect = size.width / size.height;
  const fit = aspect < 0.9 ? 0.62 : aspect < 1.4 ? 0.8 : 1;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Small amplitude keeps the two clusters balanced either side of the
    // quote; swinging further just parks both of them on one edge.
    group.current.rotation.y = Math.sin(t * 0.08) * 0.16;
    group.current.rotation.x = Math.sin(t * 0.05) * 0.08;
  });

  return (
    <group ref={group} scale={fit}>
      {children}
    </group>
  );
}

export default function ConstellationScene() {
  const { scale } = useDetail();
  const mix = useRef(0);

  // Breathe the two clusters together and apart, forever.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mix.current = (Math.sin(t * 0.25) * 0.5 + 0.5) * 0.55;
  });

  return (
    <Orbit>
      <Clusters count={Math.round(900 * scale) + 180} mix={mix} />
      <Links count={Math.round(26 * scale) + 8} />
    </Orbit>
  );
}
