export default function StreetLight({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 12]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Lamp */}
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#fff8b5"
          emissive="#fff8b5"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Arm */}
      <mesh position={[0.25, 2.8, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}