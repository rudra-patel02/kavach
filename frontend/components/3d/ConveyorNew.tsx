"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface ConveyorProps {
  running: boolean;
}

export default function ConveyorNew({ running }: ConveyorProps) {
  const beltRef = useRef<THREE.Mesh>(null);

  const box1 = useRef<THREE.Mesh>(null);
  const box2 = useRef<THREE.Mesh>(null);
  const box3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (!running) return;

    // Conveyor Belt
    if (beltRef.current) {
      beltRef.current.position.x = Math.sin(t * 2) * 0.05;
    }

    // Product Boxes
    if (box1.current) {
      box1.current.position.x = ((t * 1.2) % 5) - 2.5;
    }

    if (box2.current) {
      box2.current.position.x = (((t + 1.7) * 1.2) % 5) - 2.5;
    }

    if (box3.current) {
      box3.current.position.x = (((t + 3.4) * 1.2) % 5) - 2.5;
    }
  });

  return (
    <>
      {/* Conveyor Base */}
      <mesh position={[0, 0.35, 0]} receiveShadow>
        <boxGeometry args={[5, 0.2, 1]} />
        <meshStandardMaterial
          color="#555"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Moving Belt */}
      <mesh ref={beltRef} position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[5, 0.05, 0.8]} />
        <meshStandardMaterial
          color={running ? "#222" : "#444"}
          emissive={running ? "#2563eb" : "#000000"}
          emissiveIntensity={running ? 0.25 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Product 1 */}
      <mesh ref={box1} position={[-2.5, 0.65, 0]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>

      {/* Product 2 */}
      <mesh ref={box2} position={[-1.2, 0.65, 0]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>

      {/* Product 3 */}
      <mesh ref={box3} position={[0.5, 0.65, 0]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#F97316" />
      </mesh>
    </>
  );
}