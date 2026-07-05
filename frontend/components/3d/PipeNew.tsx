"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface PipeProps {
  running: boolean;
}

export default function Pipe({ running }: PipeProps) {
  const flow1 = useRef<THREE.Mesh>(null);
  const flow2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!running) {
      return;
    }

    const t = state.clock.getElapsedTime();

    [flow1, flow2].forEach((flow, index) => {
      if (!flow.current) {
        return;
      }

      flow.current.position.y = 1.8 + (((t * 1.6 + index * 1.2) % 2.4) - 1.2);
    });
  });

  return (
    <>
      {/* Main Pipe */}
      <mesh
        position={[-1.2, 1.8, -1]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.08, 0.08, 2.5, 20]} />

        <meshStandardMaterial
          color={running ? "#38bdf8" : "#9ca3af"}
          emissive={running ? "#38bdf8" : "#000000"}
          emissiveIntensity={running ? 1 : 0}
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={flow1} position={[-1.2, 1.1, -1]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={running ? 2.2 : 0}
          transparent
          opacity={running ? 0.86 : 0}
        />
      </mesh>

      <mesh ref={flow2} position={[-1.2, 2.2, -1]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={running ? 2.2 : 0}
          transparent
          opacity={running ? 0.86 : 0}
        />
      </mesh>
    </>
  );
}
