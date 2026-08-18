'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDetail } from './Stage';

const CORE = new THREE.Color('#41502a');
const SAGE = new THREE.Color('#7f9068');
const SAGE_SOFT = new THREE.Color('#a2b28e');
const GOLD = new THREE.Color('#c99a3f');

export type GlobeMarker = {
  id: string;
  lat: number;
  lon: number;
  /** 0..1 — drives the height and brightness of the marker pillar. */
  progress: number;
};

const RADIUS = 2;

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Dotted globe. A Fibonacci sphere gives an even point distribution
 * with no texture to download — the whole planet is ~4KB of maths.
 */
function DottedGlobe({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pos[i * 3] = Math.cos(theta) * r * RADIUS;
      pos[i * 3 + 1] = y * RADIUS;
      pos[i * 3 + 2] = Math.sin(theta) * r * RADIUS;
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  return (
    <>
      {/* Solid core, set well below the dot shell so the dots read as a
          raised skin rather than being z-fought into the surface.
          No additive rim shell here: additive blending over a cream
          page washes out to a beige halo instead of a glow. Roundness
          comes from the lighting rig instead. */}
      <mesh>
        <sphereGeometry args={[RADIUS * 0.94, 48, 48]} />
        <meshStandardMaterial color={CORE} roughness={0.62} metalness={0.15} />
      </mesh>

      <points geometry={geometry}>
        <pointsMaterial
          color={SAGE_SOFT}
          size={0.05}
          sizeAttenuation
          transparent
          opacity={1}
        />
      </points>
    </>
  );
}

/** A project site: a pillar whose height is how far the funding got. */
function Marker({ marker }: { marker: GlobeMarker }) {
  const ring = useRef<THREE.Mesh>(null);
  const base = useMemo(() => latLonToVec3(marker.lat, marker.lon, RADIUS), [marker]);

  // Orient the pillar along the surface normal.
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), base.clone().normalize());
    return q;
  }, [base]);

  // Kept short relative to RADIUS: a pillar more than ~20% of the globe's
  // radius stops reading as a site marker and starts reading as a spike.
  const height = 0.12 + marker.progress * 0.26;

  useFrame((state) => {
    if (!ring.current) return;
    // Expanding pulse ring, restarting every ~2.4s.
    const t = (state.clock.elapsedTime * 0.42) % 1;
    const s = 0.35 + t * 1.1;
    ring.current.scale.set(s, s, s);
    const mat = ring.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.6;
  });

  return (
    <group position={base} quaternion={quaternion}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.018, height, 8]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.07, 0.095, 32]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Great-circle-ish arcs linking every site to every other. */
function Arcs({ markers }: { markers: GlobeMarker[] }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const SAMPLES = 32;

    for (let i = 0; i < markers.length; i++) {
      for (let j = i + 1; j < markers.length; j++) {
        const a = latLonToVec3(markers[i].lat, markers[i].lon, RADIUS);
        const b = latLonToVec3(markers[j].lat, markers[j].lon, RADIUS);

        // Lift the control point by the angular distance so long hops
        // arc higher — otherwise they clip through the planet.
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const lift = 1 + a.angleTo(b) * 0.45;
        mid.normalize().multiplyScalar(RADIUS * lift);

        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts = curve.getPoints(SAMPLES);
        for (let k = 0; k < pts.length - 1; k++) {
          points.push(pts[k], pts[k + 1]);
        }
      }
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [markers]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={GOLD} transparent opacity={0.4} />
    </lineSegments>
  );
}

export default function GlobeScene({ markers }: { markers: GlobeMarker[] }) {
  const { scale } = useDetail();
  const group = useRef<THREE.Group>(null);

  /**
   * Face the sites, then rock gently around them.
   *
   * A globe on a continuous spin hides its own markers for most of every
   * revolution — the one thing this section exists to show. So the inner
   * group is rotated once, by the quaternion that carries the average
   * site direction onto +Z (the camera), and the outer group does the
   * rocking. Solving this with a quaternion rather than Euler angles
   * gets latitude right too, not just longitude.
   */
  const align = useMemo(() => {
    const q = new THREE.Quaternion();
    if (!markers.length) return q;

    const mean = new THREE.Vector3();
    markers.forEach((m) => mean.add(latLonToVec3(m.lat, m.lon, 1)));
    if (mean.lengthSq() < 1e-6) return q;

    q.setFromUnitVectors(mean.normalize(), new THREE.Vector3(0, 0, 1));
    return q;
  }, [markers]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Small amplitude: enough to show the sphere is round, not enough
    // to carry the sites round the back.
    group.current.rotation.y = Math.sin(t * 0.13) * 0.42;
    group.current.rotation.x = -0.1 + Math.sin(t * 0.17) * 0.06;
  });

  return (
    <>
      {/* Low ambient on purpose: a globe lit flat looks like a sticker.
          The key light gives it a terminator, the fill keeps the dark
          side from going solid black. */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={2.6} color="#fff2d6" />
      <directionalLight position={[-5, -2, -3]} intensity={0.9} color={SAGE} />
      <pointLight position={[0, 0, 4.5]} intensity={1.2} color={SAGE_SOFT} />

      <group ref={group}>
        <group quaternion={align}>
          <DottedGlobe count={Math.round(2600 * scale) + 500} />
          <Arcs markers={markers} />
          {markers.map((m) => (
            <Marker key={m.id} marker={m} />
          ))}
        </group>
      </group>
    </>
  );
}
