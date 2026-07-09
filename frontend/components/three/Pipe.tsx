export default function Pipe() {
  return (
    <mesh
      position={[-1, 2.4, 0]}
      rotation={[0, 0, Math.PI / 2]}
      castShadow
    >
      <cylinderGeometry args={[0.1, 0.1, 4, 20]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  );
}