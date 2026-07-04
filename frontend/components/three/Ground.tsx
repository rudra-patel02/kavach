"use client";

export default function Ground() {
  return (
    <group>
      {/* Main Factory Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#3b3b3b" />
      </mesh>

      {/* Production Zone */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Warehouse Zone */}
      <mesh position={[-8, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>

      {/* Control Room Zone */}
      <mesh position={[8, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Yellow Safety Lines */}
      {[-5, 0, 5].map((z) => (
        <mesh
          key={z}
          position={[0, 0.02, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[18, 0.12]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}

      {/* Vertical Safety Lines */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh
          key={x}
          position={[x, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <planeGeometry args={[12, 0.12]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}

      {/* Walkway */}
      <mesh position={[0, 0.015, -7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 2]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
    </group>
  );
}