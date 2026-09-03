"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The hero's depth layer: a slow, three-plane constellation drifting behind the
 * headline. It is the one place on the site where WebGL earns its cost — it
 * gives the hero real parallax depth that a CSS gradient cannot.
 *
 * Guards, all of them deliberate:
 *  - the whole canvas is dynamically imported and only mounted when the hero is
 *    on screen (see `Hero.tsx`), so it never runs while scrolled away;
 *  - `frameloop` is driven by the same visibility flag;
 *  - reduced-motion viewers never mount it at all;
 *  - dpr is capped at 1.6 and antialiasing is off — this is an out-of-focus
 *    background, not a product render.
 */

const PALETTE = ["#c4a25a", "#93aecb", "#e26f76"] as const;

function Constellation({ count = 900 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      // Three depth planes give the parallax something to work against.
      const plane = i % 3;
      const radius = 4.5 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;

      positions[i * 3] = Math.cos(angle) * radius * 1.35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = -plane * 3.2 - Math.random() * 2;

      color.set(PALETTE[plane]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = plane === 0 ? 0.055 : plane === 1 ? 0.038 : 0.026;
    }

    return { positions, colors, sizes };
  }, [count]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Continuous drift.
    group.rotation.z += delta * 0.012;
    group.position.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.22;

    // Pointer parallax, eased so it never snaps.
    pointer.current.x += (state.pointer.x - pointer.current.x) * 0.035;
    pointer.current.y += (state.pointer.y - pointer.current.y) * 0.035;
    group.rotation.y = pointer.current.x * 0.16;
    group.rotation.x = -pointer.current.y * 0.1;
  });

  const scale = Math.max(1, viewport.width / 14);

  return (
    <group ref={groupRef} scale={scale}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.55}
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function HeroField({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 9], fov: 46 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Constellation />
    </Canvas>
  );
}
