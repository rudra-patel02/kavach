export default function Road() {
  return (
    <group>
      {/* Main Road */}
      <mesh position={[0, 0.01, 7]}>
        <boxGeometry args={[18, 0.02, 3]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Road Markings */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-8 + i * 1.5, 0.03, 7]}>
          <boxGeometry args={[0.8, 0.01, 0.08]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
}