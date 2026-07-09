"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type Props = {
  status?: string;
};

export default function StatusBeacon({ status }: Props) {
  const beacon = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!beacon.current) return;

    const t = clock.getElapsedTime();

    if (status === "Critical") {
      beacon.current.visible = Math.sin(t * 8) > 0;
    } else {
      beacon.current.visible = true;
    }
  });

  let color = "#22c55e";

  switch (status) {
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
    <mesh ref={beacon} position={[0, 1.25, 0]}>
      <sphereGeometry args={[0.09, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={4}
      />
    </mesh>
  );
}