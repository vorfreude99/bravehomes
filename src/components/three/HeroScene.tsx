'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { Float, Instance, Instances } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { pollenFrag, pollenVert, skyFrag, skyVert } from './shaders';
import { useDetail } from './Stage';

const FOREST = new THREE.Color('#2f3a23');
const SAGE = new THREE.Color('#7f9068');
const SAGE_SOFT = new THREE.Color('#a2b28e');
const GOLD = new THREE.Color('#c99a3f');
const CREAM = new THREE.Color('#ffffff');
const CLAY = new THREE.Color('#c9704f');

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

function Sky() {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#edf1e8') },
      uBottom: { value: new THREE.Color('#ffffff') },
      uGlow: { value: GOLD.clone() },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh scale={60}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The home                                                            */
/* ------------------------------------------------------------------ */

function Home({ position = [0, 0, 0] as [number, number, number] }) {
  const windows = useRef<THREE.MeshStandardMaterial>(null);

  // Windows breathe like someone's home and the lamp is on.
  useFrame((state) => {
    if (!windows.current) return;
    const t = state.clock.elapsedTime;
    windows.current.emissiveIntensity = 1.5 + Math.sin(t * 1.3) * 0.25;
  });

  return (
    <group position={position}>
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.6, 1, 1.4]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>

      {/* Roof — a 4-sided cone reads as a pitched roof */}
      <mesh castShadow position={[0, 1.32, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.32, 0.78, 4]} />
        <meshStandardMaterial color={FOREST} roughness={0.7} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.32, 0.71]}>
        <boxGeometry args={[0.36, 0.62, 0.04]} />
        <meshStandardMaterial color={FOREST} roughness={0.6} />
      </mesh>

      {/* Lit windows */}
      {[
        [-0.48, 0.66, 0.71],
        [0.48, 0.66, 0.71],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.34, 0.3, 0.04]} />
          <meshStandardMaterial
            ref={i === 0 ? windows : undefined}
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Chimney */}
      <mesh position={[0.52, 1.5, -0.2]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color={CLAY} roughness={0.9} />
      </mesh>

      {/* Warm spill of light from the windows onto the ground */}
      <pointLight position={[0, 0.8, 1.1]} intensity={2.4} distance={4} color={GOLD} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Landscape                                                           */
/* ------------------------------------------------------------------ */

function Island() {
  return (
    <group>
      {/* Grass cap */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <cylinderGeometry args={[4.2, 4.0, 0.4, 48]} />
        <meshStandardMaterial color={SAGE} roughness={1} />
      </mesh>

      {/* Soil, tapering to a point so the island reads as floating */}
      <mesh position={[0, -1.5, 0]}>
        <coneGeometry args={[4.0, 2.8, 48]} />
        <meshStandardMaterial color="#6b7a4a" roughness={1} />
      </mesh>

      {/* Path to the door */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 1.6]}>
        <planeGeometry args={[0.6, 2.2]} />
        <meshStandardMaterial color={CREAM} roughness={1} />
      </mesh>
    </group>
  );
}

type TreeSpec = { position: [number, number, number]; scale: number };

function Trees({ count }: { count: number }) {
  const trees = useMemo<TreeSpec[]>(() => {
    // Deterministic layout — a seeded PRNG keeps SSR and client identical
    // and stops the scene reshuffling on every hot reload.
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const out: TreeSpec[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 1.9 + rand() * 1.9;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Keep the front path and the house footprint clear.
      if (Math.abs(x) < 1.3 && z > 0.2) continue;
      out.push({ position: [x, 0.1, z], scale: 0.7 + rand() * 0.6 });
    }
    return out;
  }, [count]);

  return (
    <group>
      {/* Trunks and canopies are instanced: one draw call each. */}
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.6, 6]} />
        <meshStandardMaterial color="#7a5a3a" roughness={1} />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.position[0], t.position[1] + 0.3 * t.scale, t.position[2]]}
            scale={t.scale}
          />
        ))}
      </Instances>

      <Instances limit={trees.length} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={FOREST} roughness={0.9} flatShading />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.position[0], t.position[1] + 0.85 * t.scale, t.position[2]]}
            scale={t.scale}
          />
        ))}
      </Instances>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Pollen                                                              */
/* ------------------------------------------------------------------ */

function Pollen({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const scale = new Float32Array(count);

    let s = 90210;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = rand() * 5.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = rand() * 4.5 - 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      seed[i] = rand();
      scale[i] = 0.5 + rand() * 1.6;
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: GOLD.clone() },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uPixelRatio.value = viewport.dpr;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={pollenVert}
        fragmentShader={pollenFrag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

function CameraRig() {
  const { camera, pointer, viewport, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.4, 0));

  useFrame((_, delta) => {
    // Pull back on narrow viewports so the island still fits the frame.
    const aspect = size.width / size.height;
    const distance = aspect < 1 ? 13.5 : aspect < 1.5 ? 14 : 12.5;

    const damp = 1 - Math.pow(0.001, delta);
    camera.position.x += (pointer.x * 1.4 - camera.position.x) * damp;
    camera.position.y += (3.4 + pointer.y * 0.6 - camera.position.y) * damp;
    camera.position.z += (distance - camera.position.z) * damp;
    camera.lookAt(target.current);
  });

  // `viewport` is read so the rig re-evaluates on resize.
  void viewport;
  return null;
}

/* ------------------------------------------------------------------ */

/**
 * Layers are opt-out so one scene can serve very different heroes.
 *
 * `showIsland` — the island only reads as a village when there is room
 * for the whole of it; cropped behind a photo it looks like stray
 * geometry.
 * `showSky` — the sky dome is opaque, so it must be off over a
 * full-bleed photograph or it paints the picture out entirely, leaving
 * just the pollen drifting on a transparent canvas.
 */
export default function HeroScene({
  showIsland = true,
  showSky = true,
}: {
  showIsland?: boolean;
  showSky?: boolean;
}) {
  const { scale, shadows } = useDetail();
  const { size } = useThree();

  /**
   * On desktop the island sits right of the headline column. On a phone
   * there is no "beside" — the layout is one column — so it centres and
   * drops behind the lower half instead of hiding off the right edge.
   */
  const narrow = size.width < 1024;
  // Dropped low on desktop so the island's grass and treetops read around
  // the edges of the photograph rather than being hidden behind it.
  const islandPosition: [number, number, number] = narrow
    ? [0, -3.1, -1.2]
    : [2.6, -2.9, -1.6];

  return (
    <>
      {showSky && <Sky />}
      <CameraRig />

      {/* Light mostly from overhead: low sun angles threw a long, muddy
          shadow across the island that read as a smear, not a shadow. */}
      <ambientLight intensity={1.35} color={CREAM} />
      <hemisphereLight args={[SAGE_SOFT, '#6b7a4a', 0.85]} />
      <directionalLight
        castShadow={shadows}
        position={[2.5, 10, 4]}
        intensity={1.9}
        color="#fff2d6"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* The whole island drifts — it should feel held, not planted.
          Pushed right and down so the headline column stays clear. */}
      {showIsland && (
        <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.5}>
          <group position={islandPosition} scale={0.98}>
            <Island />
            <Home position={[0, 0.1, 0]} />
            <Trees count={Math.round(22 * scale) + 6} />
          </group>
        </Float>
      )}

      <Pollen count={Math.round(420 * scale) + 60} />
    </>
  );
}
