"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type Props = {
  temperature?: number;
};

export default function Steam({ temperature = 25 }: Props) {
  const steam = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!steam.current) return;

    const t = clock.getElapsedTime();

    steam.current.position.y = 1.1 + Math.sin(t * 2) * 0.08;

    steam.current.visible = temperature > 90;

    steam.current.children.forEach((child, index) => {
      child.position.y = Math.sin(t * 2 + index) * 0.15;
    });
  });

  return (
    <group ref={steam} position={[0, 1.2, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.18, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}