"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface ChimneyProps {
  running: boolean;
}

export default function Chimney({ running }: ChimneyProps) {
  const smoke1 = useRef<THREE.Mesh>(null!);
  const smoke2 = useRef<THREE.Mesh>(null!);
  const smoke3 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    [smoke1, smoke2, smoke3].forEach((smoke, index) => {
      if (!smoke.current) return;

      const progress = ((t * (running ? 1 : 0.2)) + index * 0.8) % 3;

      smoke.current.position.y = 4 + progress;

      smoke.current.position.x =
        2.7 + Math.sin(t + index) * 0.12;

      smoke.current.position.z =
        -2 + Math.cos(t + index) * 0.12;

      const scale = running
        ? 0.3 + progress * 0.2
        : 0.15;

      smoke.current.scale.set(scale, scale, scale);

      const material =
        smoke.current.material as THREE.MeshStandardMaterial;

      material.opacity = running
        ? 0.6 - progress * 0.18
        : 0.15;
    });
  });

  return (
    <group>
      {/* Chimney */}
      <mesh position={[2.7, 2, -2]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 4, 32]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh ref={smoke1} position={[2.7, 4, -2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.5} />
      </mesh>

      <mesh ref={smoke2} position={[2.7, 4.8, -2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.5} />
      </mesh>

      <mesh ref={smoke3} position={[2.7, 5.6, -2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
