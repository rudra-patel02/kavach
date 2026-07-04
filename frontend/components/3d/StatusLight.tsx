"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function StatusLight({
  position,
  color = "lime",
}: {
  position: [number, number, number];
  color?: string;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity =
        Math.sin(clock.getElapsedTime() * 5) * 0.5 + 1;
    }
  });

  return (
    <>
      <mesh position={position}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>

      <pointLight
        position={position}
        color={color}
        intensity={2}
        distance={2}
      />
    </>
  );
}
