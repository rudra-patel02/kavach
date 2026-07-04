"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function ConveyorBelt() {
  const box1 = useRef<THREE.Mesh>(null!);
  const box2 = useRef<THREE.Mesh>(null!);
  const box3 = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    [box1, box2, box3].forEach((box) => {
      if (!box.current) return;

      box.current.position.x += 0.02;

      if (box.current.position.x > 3) {
        box.current.position.x = -3;
      }
    });
  });

  return (
    <group>

      {/* Conveyor Frame */}
      <mesh position={[0, 0.15, 2]} receiveShadow>
        <boxGeometry args={[6.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.28, 2]}>
        <boxGeometry args={[6, 0.05, 1]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Rollers */}
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <mesh
          key={x}
          position={[x, 0.22, 2]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.08, 0.08, 1, 16]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>
      ))}

      {/* Moving Packages */}
      <mesh ref={box1} position={[-3, 0.55, 2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      <mesh ref={box2} position={[-1, 0.55, 2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>

      <mesh ref={box3} position={[1, 0.55, 2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

    </group>
  );
}