"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface TankProps {
  running: boolean;
}

export default function Tank({ running }: TankProps) {
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!liquidRef.current) return;

    const targetHeight = running ? 1.3 : 0.2;

    liquidRef.current.scale.y +=
      (targetHeight - liquidRef.current.scale.y) * 0.05;
  });

  return (
    <>
      {/* Tank */}
      <mesh position={[-2.5, 1, -1]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 2, 32]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Liquid */}
      <mesh
        ref={liquidRef}
        position={[-2.5, 0.25, -1]}
      >
        <cylinderGeometry args={[0.65, 0.65, 1, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.75}
          emissive="#38bdf8"
          emissiveIntensity={0.4}
        />
      </mesh>
    </>
  );
}