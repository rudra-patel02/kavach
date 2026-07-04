"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Machine({ machine }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Floating animation
    if (groupRef.current) {
      groupRef.current.position.y =
        0.6 + Math.sin(t * 6) * 0.02;

      // Rotate only when machine is running
      if (machine?.status === "Running") {
        groupRef.current.rotation.y += 0.01;
      }
    }

    // Gear rotation
    if (gearRef.current) {
      if (machine?.status === "Running") {
        gearRef.current.rotation.z += 0.08;
      } else {
        gearRef.current.rotation.z += 0.02;
      }
    }
  });

  const bodyColor =
    machine?.status === "Critical"
      ? "#ef4444"
      : machine?.status === "Warning"
      ? "#facc15"
      : machine?.status === "Maintenance"
      ? "#f97316"
      : machine?.status === "Idle"
      ? "#94a3b8"
      : "#06b6d4";

  const lightColor =
    machine?.status === "Critical"
      ? "#ff0000"
      : machine?.status === "Warning"
      ? "#ffff00"
      : machine?.status === "Maintenance"
      ? "#fb923c"
      : machine?.status === "Idle"
      ? "#94a3b8"
      : "#22c55e";

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      {/* Main Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Top Cap */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.3, 0.12, 1.3]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      {/* Rotating Gear */}
      <mesh ref={gearRef} position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.12, 18]} />
        <meshStandardMaterial
          color="#d1d5db"
          metalness={1}
          roughness={0.15}
        />
      </mesh>

      {/* Front Panel */}
      <mesh position={[0, 0, 0.61]}>
        <boxGeometry args={[0.55, 0.5, 0.05]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Status Light */}
      <mesh position={[0.43, 0.33, 0.64]}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={
            machine?.status === "Running" ? 4 : 2
          }
        />
      </mesh>
    </group>
  );
}