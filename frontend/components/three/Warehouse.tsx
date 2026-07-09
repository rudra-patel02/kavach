"use client";

export default function Warehouse() {
  return (
    <group position={[-8, 0, 0]}>
      {/* Floor */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Storage Rack 1 */}
      <mesh position={[-1.6, 1.2, -1.4]} castShadow>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <mesh position={[-1.6, 1.2, 1.4]} castShadow>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <mesh position={[-1.6, 2.2, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 3]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Rack Boxes */}
      {[0.6, 1.3, 2.0].map((y) => (
        <mesh key={y} position={[-1.25, y, 0]}>
          <boxGeometry args={[0.5, 0.35, 0.5]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      ))}

      {/* Wooden Pallets */}
      {[0, 1.2, 2.4].map((x) => (
        <group key={x} position={[x, 0.12, -1.6]}>
          <mesh>
            <boxGeometry args={[0.8, 0.08, 0.8]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>

          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.55, 0.45, 0.55]} />
            <meshStandardMaterial color="#c08457" />
          </mesh>
        </group>
      ))}
    </group>
  );
}