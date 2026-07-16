export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.8} />

      <hemisphereLight
        args={["#67e8f9", "#020617", 1.1]}
      />

      <directionalLight
        position={[8, 10, 6]}
        intensity={2.4}
        castShadow
      />

      <pointLight
        position={[0, 5, 0]}
        intensity={2}
        color="#00e5ff"
      />

      <pointLight
        position={[-4, 3, -3]}
        intensity={1.4}
        color="#34d399"
      />
    </>
  );
}
