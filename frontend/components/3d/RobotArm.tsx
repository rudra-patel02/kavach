"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface RobotArmProps {
  running: boolean;
}

export default function RobotArm({ running }: RobotArmProps) {
  const armRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!armRef.current) return;

    const t = state.clock.getElapsedTime();

    if (running) {
      armRef.current.rotation.z =
        -0.7 + Math.sin(t * 2) * 0.5;
    } else {
      armRef.current.rotation.z +=
        (-0.7 - armRef.current.rotation.z) * 0.05;
    }
  });

  return (
    <>
      {/* Base */}
      <mesh position={[2, 0.6, 1]} castShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial
          color="#facc15"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Arm */}
      <group ref={armRef} position={[2, 1.3, 1]}>
        <mesh position={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[1, 0.2, 0.2]} />
          <meshStandardMaterial
            color="#facc15"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Gripper */}
        <mesh position={[1.05, -0.08, 0]}>
          <boxGeometry args={[0.12, 0.25, 0.12]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>

        <mesh position={[1.05, 0.08, 0]}>
          <boxGeometry args={[0.12, 0.25, 0.12]} />
          <meshStandardMaterial color="#9CA3AF" />
        </mesh>
      </group>
    </>
  );
}