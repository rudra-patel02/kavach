"use client";

export default function StatusLight({
  position,
  color = "lime",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <>
      <mesh position={position}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial
  color={color}
  emissive={color}
  emissiveIntensity={
    Math.sin(Date.now() * 0.005) * 0.5 + 1
  }
/>
      </mesh>

      <pointLight
        position={position}
        color={color}
        intensity={2}
        distance={2}
      />
    </>
  );
}