"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { MachineDisplayData } from "@/types/machine";

export default function Machine({
  machine,
  selected = false,
  hovered = false,
}: {
  machine: MachineDisplayData;
  selected?: boolean;
  hovered?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const isActive = machine?.status === "Running" || selected || hovered;

    if (!isActive) {
      return;
    }

    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.position.y =
        0.6 + Math.sin(t * 6) * 0.02;

      if (machine?.status === "Running") {
        groupRef.current.rotation.y += 0.01;
      }
    }

    if (gearRef.current) {
      if (machine?.status === "Running") {
        gearRef.current.rotation.z += 0.08;
      } else if (hovered || selected) {
        gearRef.current.rotation.z += 0.02;
      }
    }
  });

  const bodyColor =
    machine?.aiAnomalySeverity === "Critical" ||
    Number(machine?.aiFailureProbability || 0) >= 80 ||
    machine?.status === "Critical"
      ? "#ef4444"
      : machine?.aiAnomalySeverity === "High" ||
        Number(machine?.aiFailureProbability || 0) >= 60 ||
        machine?.status === "Warning"
      ? "#f97316"
      : machine?.aiAnomalySeverity === "Medium"
      ? "#facc15"
      : machine?.status === "Maintenance"
      ? "#f97316"
      : machine?.status === "Idle"
      ? "#94a3b8"
      : "#06b6d4";

  const lightColor =
    machine?.aiAnomalySeverity === "Critical" ||
    Number(machine?.aiFailureProbability || 0) >= 80 ||
    machine?.status === "Critical"
      ? "#ff0000"
      : machine?.aiAnomalySeverity === "High" ||
        machine?.aiAnomalySeverity === "Medium" ||
        machine?.status === "Warning"
      ? "#ffff00"
      : machine?.status === "Maintenance"
      ? "#fb923c"
      : machine?.status === "Idle"
      ? "#94a3b8"
      : "#22c55e";

  return (
    <group
      ref={groupRef}
      position={[0, 0.6, 0]}
      scale={selected ? 1.12 : hovered ? 1.06 : 1}
    >
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

      {selected || hovered ? (
        <mesh position={[0, -0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.92, 1.05, 48]} />
          <meshStandardMaterial
            color={selected ? "#22d3ee" : "#94a3b8"}
            emissive={selected ? "#22d3ee" : "#64748b"}
            emissiveIntensity={selected ? 1.2 : 0.45}
            transparent
            opacity={0.72}
          />
        </mesh>
      ) : null}
    </group>
  );
}
