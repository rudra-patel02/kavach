"use client";

interface PipeProps {
  running: boolean;
}

export default function Pipe({ running }: PipeProps) {
  return (
    <>
      {/* Main Pipe */}
      <mesh
        position={[-1.2, 1.8, -1]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.08, 0.08, 2.5, 20]} />

        <meshStandardMaterial
          color={running ? "#38bdf8" : "#9ca3af"}
          emissive={running ? "#38bdf8" : "#000000"}
          emissiveIntensity={running ? 1 : 0}
          metalness={1}
          roughness={0.2}
        />
      </mesh>
    </>
  );
}