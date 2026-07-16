"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function StatusLight({
  position,
  color = "lime",
  intensity = 2,
  size = 0.08,
}: {
  position: [number, number, number];
  color?: string;
  intensity?: number;
  size?: number;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const shouldPulse = color !== "#94a3b8" && color !== "#64748b";

  useFrame(({ clock }) => {
    if (!shouldPulse) {
      return;
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity =
        (Math.sin(clock.getElapsedTime() * 5) * 0.35 + 1) * intensity;
    }
  });

  return (
    <>
      <mesh position={position}>
        <sphereGeometry args={[size, 20, 20]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </mesh>

      <pointLight
        position={position}
        color={color}
        intensity={intensity}
        distance={2.5}
      />
    </>
  );
}
