export default function Tank() {
  return (
    <mesh position={[-3, 1, 2]} castShadow>
      <cylinderGeometry args={[0.8, 0.8, 2, 32]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  );
}