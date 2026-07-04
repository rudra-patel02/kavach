export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[8, 10, 6]}
        intensity={2}
        castShadow
      />

      <pointLight
        position={[0, 5, 0]}
        intensity={2}
        color="#00e5ff"
      />
    </>
  );
}