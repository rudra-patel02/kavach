"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Conveyor() {
  const crate1 = useRef<THREE.Mesh>(null);
  const crate2 = useRef<THREE.Mesh>(null);
  const crate3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    [crate1, crate2, crate3].forEach((crate) => {
      if (!crate.current) return;

      crate.current.position.x += delta * 1.2;

      if (crate.current.position.x > 2.4) {
        crate.current.position.x = -2.4;
      }
    });
  });

  return (
    <group position={[0, 0.05, 0]}>
      {/* Conveyor Base */}
      <mesh receiveShadow>
        <boxGeometry args={[5, 0.15, 1]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Moving Belt */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[5, 0.03, 0.9]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Rollers */}
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1, 20]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      ))}

      {/* Crate 1 */}
      <mesh ref={crate1} position={[-2.2, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>

      {/* Crate 2 */}
      <mesh ref={crate2} position={[-0.8, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>

      {/* Crate 3 */}
      <mesh ref={crate3} position={[0.8, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}