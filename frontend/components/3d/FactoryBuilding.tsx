export default function FactoryBuilding() {
  return (
    <group>

      {/* Main Building */}
      <mesh position={[0, 1.5, -5]}>
        <boxGeometry args={[8, 3, 4]} />
        <meshStandardMaterial color="#3b4758" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 3.2, -5]}>
        <boxGeometry args={[8.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#5f6d80" />
      </mesh>

      {/* Front Door */}
      <mesh position={[0, 0.6, -2.95]}>
        <boxGeometry args={[1.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Left Tank */}
      <mesh position={[-4.8, 1.2, -4]}>
        <cylinderGeometry args={[0.7, 0.7, 2.4, 32]} />
        <meshStandardMaterial color="#8b949e" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Right Tank */}
      <mesh position={[4.8, 1.2, -4]}>
        <cylinderGeometry args={[0.7, 0.7, 2.4, 32]} />
        <meshStandardMaterial color="#8b949e" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Factory Sign */}
      <mesh position={[0, 3.8, -2.9]}>
        <boxGeometry args={[3.5, 0.5, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Windows */}
      {[-2.5, -1, 1, 2.5].map((x) => (
        <mesh key={x} position={[x, 2, -2.95]}>
          <boxGeometry args={[0.8, 0.6, 0.1]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#22d3ee"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

    </group>
  );
}