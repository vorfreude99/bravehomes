'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDetail } from './Stage';
import { bricksFor, MAX_BRICKS } from './brick-utils';

const CLAY = new THREE.Color('#c9704f');
const GOLD = new THREE.Color('#c99a3f');
const SAGE = new THREE.Color('#7f9068');

const PER_ROW = 9;
const BRICK = { w: 0.44, h: 0.2, d: 0.24 };
const GAP = 0.02;

type Slot = { x: number; y: number; z: number; rot: number };

/** Where each brick sits once laid. Running bond: every other row offset. */
function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  const rowWidth = PER_ROW * (BRICK.w + GAP);

  for (let i = 0; i < MAX_BRICKS; i++) {
    const row = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    const stagger = row % 2 === 0 ? 0 : (BRICK.w + GAP) / 2;

    slots.push({
      x: col * (BRICK.w + GAP) - rowWidth / 2 + (BRICK.w + GAP) / 2 + stagger,
      y: row * (BRICK.h + GAP) + BRICK.h / 2,
      z: 0,
      // A touch of hand-laid imperfection; nothing here is machine-made.
      rot: (((i * 2654435761) % 1000) / 1000 - 0.5) * 0.05,
    });
  }

  return slots;
}

function Wall({ target }: { target: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const slots = useMemo(buildSlots, []);

  /** Per-brick animation progress, 0 (in the air) → 1 (laid). */
  const progress = useRef<Float32Array>(new Float32Array(MAX_BRICKS));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colour = useMemo(() => new THREE.Color(), []);
  const settled = useRef(false);

  // A change in target restarts the loop so removed bricks lift away too.
  useEffect(() => {
    settled.current = false;
  }, [target]);

  useFrame((_, delta) => {
    const instanced = mesh.current;
    if (!instanced || settled.current) return;

    const p = progress.current;
    let animating = false;
    const step = delta * 2.6;

    for (let i = 0; i < MAX_BRICKS; i++) {
      const wanted = i < target ? 1 : 0;

      // Stagger by index so the wall builds course by course.
      const delayed = wanted === 1 && i > target - 1 - 26 ? 1 : wanted;

      if (Math.abs(p[i] - delayed) > 0.001) {
        p[i] += Math.sign(delayed - p[i]) * step;
        p[i] = THREE.MathUtils.clamp(p[i], 0, 1);
        animating = true;
      }

      const t = p[i];
      // easeOutBack: the brick settles with a small, satisfying overshoot.
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = t === 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

      const slot = slots[i];
      dummy.position.set(
        slot.x,
        slot.y + (1 - eased) * 2.4,
        slot.z + (1 - eased) * 0.6,
      );
      dummy.rotation.set((1 - eased) * 0.9, slot.rot, (1 - eased) * 0.5);
      dummy.scale.setScalar(t <= 0.001 ? 0.0001 : 1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);

      // The newest course glows gold, then cools to clay.
      const heat = THREE.MathUtils.clamp((t - 0.55) / 0.45, 0, 1);
      colour.copy(GOLD).lerp(CLAY, heat);
      instanced.setColorAt(i, colour);
    }

    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;

    // Stop touching buffers once the wall has settled.
    if (!animating) settled.current = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, MAX_BRICKS]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[BRICK.w, BRICK.h, BRICK.d]} />
      <meshStandardMaterial roughness={0.85} metalness={0} />
    </instancedMesh>
  );
}

/**
 * A hint of ground so the wall isn't floating in a void — kept small and
 * faint, because at full size it read as a pale slab competing with the
 * bricks rather than supporting them.
 */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[2.0, 48]} />
      <meshStandardMaterial color={SAGE} roughness={1} transparent opacity={0.16} />
    </mesh>
  );
}

function Rig({ target }: { target: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Slide the wall down as it grows so the top course stays in frame
    // instead of climbing out of the top of the canvas.
    const rows = Math.ceil(target / PER_ROW);
    const wantedY = -0.55 - Math.min(rows, 16) * (BRICK.h + GAP) * 0.42;
    const damp = 1 - Math.pow(0.004, delta);
    group.current.position.y += (wantedY - group.current.position.y) * damp;

    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
  });

  return (
    <group ref={group} position={[0, -0.55, 0]} scale={1.15}>
      <Ground />
      <Wall target={target} />
    </group>
  );
}

export default function BrickScene({ amount }: { amount: number }) {
  const { shadows } = useDetail();
  const target = bricksFor(amount);

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight
        castShadow={shadows}
        position={[3, 6, 4]}
        intensity={2.2}
        color="#fff2d6"
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 3]} intensity={1.4} color={GOLD} />
      <Rig target={target} />
    </>
  );
}
