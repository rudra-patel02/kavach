"use client";

export default function Factory() {
  return (
    <group>
      {/* Factory Floor */}
      <mesh receiveShadow position={[0, -0.01, 0]}>
        <boxGeometry args={[18, 0.02, 12]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Main Building */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[10.5, 0.25, 6.5]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Left Warehouse */}
      <mesh position={[-6, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Right Control Room */}
      <mesh position={[6, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2, 3]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Chimney 1 */}
      <mesh position={[3.5, 4, -2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 2.5, 32]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Chimney 2 */}
      <mesh position={[2.7, 3.7, -2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 2, 32]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Loading Platform */}
      <mesh position={[-6, 0.2, 3]}>
        <boxGeometry args={[3, 0.3, 2]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>

      {/* Factory Entrance */}
      <mesh position={[0, 0.75, 3.01]}>
        <boxGeometry args={[1.8, 1.5, 0.1]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Windows */}
      {[-3, -1, 1, 3].map((x) => (
        <mesh key={x} position={[x, 2, 3.02]}>
          <boxGeometry args={[0.8, 0.8, 0.05]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}