"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import MachineLabel from "./MachineLabel";
import StatusBeacon from "./StatusBeacon";
import Steam from "./Steam";

type MachineData = {
  status?: string;
  health?: number;
  temperature?: number;
  aiPrediction?: {
    failureRisk?: string;
  };
};

export default function Machine({
  position,
  machine,
}: {
  position: [number, number, number];
  machine: MachineData;
}) {
  const motor = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!motor.current) return;

    if (machine.status === "Running") {
      motor.current.rotation.y += delta * 6;
    } else if (machine.status === "Warning") {
      motor.current.rotation.y += delta * 2;
    }
  });

  let color = "#22c55e";

  switch (machine.status) {
    case "Running":
      color = "#22c55e";
      break;
    case "Warning":
      color = "#facc15";
      break;
    case "Critical":
      color = "#ef4444";
      break;
    case "Offline":
      color = "#6b7280";
      break;
  }

  return (
    <group position={position}>
      {/* Machine Body */}
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Rotating Motor */}
      <mesh ref={motor} position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 24]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>

      {/* Status Light */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
      <MachineLabel machine={machine} />
      <StatusBeacon status={machine.status} />
      <Steam temperature={machine.temperature} />
    </group>
  );
}