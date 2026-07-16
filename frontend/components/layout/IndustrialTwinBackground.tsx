"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const cyan = "#22d3ee";
const emerald = "#34d399";
const violet = "#a78bfa";
const steel = "#475569";
const darkSteel = "#0f172a";

function FloorDeck() {
  const railMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#12303d",
        emissive: "#0891b2",
        emissiveIntensity: 0.14,
        metalness: 0.7,
        roughness: 0.26,
      }),
    []
  );

  return (
    <group position={[0, -1.62, -5.1]}>
      <mesh receiveShadow>
        <boxGeometry args={[22, 0.1, 13.5]} />
        <meshStandardMaterial color="#020617" metalness={0.58} roughness={0.42} />
      </mesh>

      {[-9, -6, -3, 0, 3, 6, 9].map((x) => (
        <mesh key={`deck-rail-${x}`} position={[x, 0.07, 0]} material={railMaterial}>
          <boxGeometry args={[0.03, 0.025, 12.4]} />
        </mesh>
      ))}

      {[-5, -2.5, 0, 2.5, 5].map((z) => (
        <mesh key={`deck-track-${z}`} position={[0, 0.08, z]} material={railMaterial}>
          <boxGeometry args={[20, 0.025, 0.03]} />
        </mesh>
      ))}

      <mesh position={[0, 0.09, 2.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 96]} />
        <meshBasicMaterial color={cyan} transparent opacity={0.035} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FactoryBlock({
  x,
  z,
  width,
  height,
  depth,
  accent,
}: {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  accent: string;
}) {
  const windowRows = Math.max(2, Math.floor(height * 1.3));
  const windowCols = Math.max(2, Math.floor(width * 1.4));

  return (
    <group position={[x, -1.56 + height / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={darkSteel}
          emissive={accent}
          emissiveIntensity={0.09}
          metalness={0.66}
          roughness={0.32}
        />
      </mesh>

      <mesh position={[0, height / 2 + 0.055, 0]}>
        <boxGeometry args={[width * 0.92, 0.1, depth * 0.88]} />
        <meshStandardMaterial
          color="#0b1120"
          emissive={accent}
          emissiveIntensity={0.18}
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>

      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowCols }).map((__, col) => (
          <mesh
            key={`win-${row}-${col}`}
            position={[
              -width / 2 + 0.36 + col * ((width - 0.72) / Math.max(1, windowCols - 1)),
              -height / 2 + 0.52 + row * 0.52,
              depth / 2 + 0.012,
            ]}
          >
            <boxGeometry args={[0.12, 0.06, 0.018]} />
            <meshBasicMaterial color={accent} transparent opacity={0.72} />
          </mesh>
        ))
      )}
    </group>
  );
}

function StorageTank({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.58, 0.62, 1.48, 40]} />
        <meshStandardMaterial color={steel} metalness={0.86} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.035, 12, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.52} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PipeRun() {
  return (
    <group position={[0, -0.6, -4.35]}>
      {[-4.8, -2.4, 0, 2.4, 4.8].map((x, index) => (
        <mesh key={`pipe-${x}`} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 7.2, 24]} />
          <meshStandardMaterial
            color={index % 2 ? "#64748b" : "#0891b2"}
            emissive={index % 2 ? "#0f172a" : cyan}
            emissiveIntensity={index % 2 ? 0.04 : 0.24}
            metalness={0.92}
            roughness={0.16}
          />
        </mesh>
      ))}

      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={`pipe-joint-${x}`} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.025, 10, 28]} />
          <meshStandardMaterial color={emerald} emissive={emerald} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedConveyor() {
  const carriers = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!carriers.current) return;

    carriers.current.children.forEach((box) => {
      box.position.x += delta * 0.9;

      if (box.position.x > 5.2) {
        box.position.x = -5.2;
      }
    });
  });

  return (
    <group position={[0, -1.24, -1.85]}>
      <mesh receiveShadow>
        <boxGeometry args={[10.8, 0.22, 0.72]} />
        <meshStandardMaterial color="#111827" metalness={0.76} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[10.5, 0.08, 0.5]} />
        <meshStandardMaterial
          color="#0e7490"
          emissive="#0891b2"
          emissiveIntensity={0.32}
          metalness={0.45}
          roughness={0.22}
        />
      </mesh>
      <group ref={carriers}>
        {[-5, -3, -1, 1.3, 3.4].map((x, index) => (
          <mesh key={x} castShadow position={[x, 0.48, 0]}>
            <boxGeometry args={[0.48, 0.38, 0.44]} />
            <meshStandardMaterial
              color={index % 2 ? "#67e8f9" : "#34d399"}
              emissive={index % 2 ? "#0891b2" : "#059669"}
              emissiveIntensity={0.34}
              metalness={0.36}
              roughness={0.28}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RoboticArm({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;

    if (shoulder.current) {
      shoulder.current.rotation.z = -0.45 + Math.sin(t * 0.8) * 0.24;
    }
    if (elbow.current) {
      elbow.current.rotation.z = 0.34 + Math.cos(t * 0.9) * 0.18;
    }
    if (wrist.current) {
      wrist.current.rotation.z = -0.16 + Math.sin(t * 1.4) * 0.22;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.24, 0.36, 0.66, 32]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.2} />
      </mesh>
      <group ref={shoulder} position={[0, 0.86, 0]}>
        <mesh castShadow position={[0.64, 0, 0]}>
          <boxGeometry args={[1.3, 0.18, 0.24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.64} roughness={0.22} />
        </mesh>
        <group ref={elbow} position={[1.28, 0, 0]}>
          <mesh castShadow position={[0.46, -0.2, 0]}>
            <boxGeometry args={[0.98, 0.15, 0.2]} />
            <meshStandardMaterial color="#f97316" metalness={0.62} roughness={0.24} />
          </mesh>
          <group ref={wrist} position={[0.95, -0.32, 0]}>
            <mesh position={[0.16, -0.18, 0]}>
              <boxGeometry args={[0.36, 0.1, 0.16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.78} roughness={0.18} />
            </mesh>
            <mesh position={[0.38, -0.36, 0.09]}>
              <boxGeometry args={[0.08, 0.32, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.18} />
            </mesh>
            <mesh position={[0.38, -0.36, -0.09]}>
              <boxGeometry args={[0.08, 0.32, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.18} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function CraneSystem() {
  const trolley = useRef<THREE.Group>(null);
  const hook = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const travel = Math.sin(t * 0.32) * 3.6;

    if (trolley.current) {
      trolley.current.position.x = travel;
    }
    if (hook.current) {
      hook.current.position.y = -0.58 + Math.sin(t * 0.54) * 0.18;
    }
  });

  return (
    <group position={[0, 1.12, -3.35]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10.8, 0.12, 0.14]} />
        <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.18} />
      </mesh>
      {[-5.2, 5.2].map((x) => (
        <mesh key={x} position={[x, -1.35, 0]}>
          <boxGeometry args={[0.16, 2.7, 0.16]} />
          <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.22} />
        </mesh>
      ))}
      <group ref={trolley} position={[0, -0.16, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.28, 0.38]} />
          <meshStandardMaterial color="#f97316" emissive="#f59e0b" emissiveIntensity={0.16} />
        </mesh>
        <group ref={hook} position={[0, -0.58, 0]}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.72, 10]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.025, 10, 24, Math.PI * 1.35]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function AgvFleet() {
  const fleet = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!fleet.current) return;

    const t = clock.getElapsedTime();
    fleet.current.children.forEach((vehicle, index) => {
      vehicle.position.x = ((t * (0.75 + index * 0.08) + index * 4.2) % 12) - 6;
      vehicle.position.z = index % 2 ? 1.15 : 3.65;
      vehicle.rotation.y = index % 2 ? Math.PI : 0;
    });
  });

  return (
    <group ref={fleet} position={[0, -1.34, -5.1]}>
      {[0, 1, 2].map((item) => (
        <group key={item}>
          <mesh castShadow position={[0, 0.18, 0]}>
            <boxGeometry args={[0.78, 0.24, 0.46]} />
            <meshStandardMaterial
              color={item % 2 ? "#0f766e" : "#0369a1"}
              emissive={item % 2 ? emerald : cyan}
              emissiveIntensity={0.22}
              metalness={0.55}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0.28, 0.34, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.48]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.82} />
          </mesh>
          {[-0.3, 0.3].map((x) =>
            [-0.26, 0.26].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, 0.03, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
                <meshStandardMaterial color="#020617" metalness={0.5} roughness={0.42} />
              </mesh>
            ))
          )}
        </group>
      ))}
    </group>
  );
}

function SmokeStack({ position }: { position: [number, number, number] }) {
  const smoke = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!smoke.current) return;

    const t = clock.getElapsedTime();
    smoke.current.children.forEach((cloud, index) => {
      const progress = (t * 0.2 + index * 0.18) % 1;
      const scale = 0.22 + progress * 0.7;

      cloud.position.y = 1.55 + progress * 2.2;
      cloud.position.x = Math.sin(t * 0.55 + index) * 0.22;
      cloud.position.z = Math.cos(t * 0.38 + index) * 0.16;
      cloud.scale.setScalar(scale);
    });
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 1.9, 28]} />
        <meshStandardMaterial color="#475569" metalness={0.84} roughness={0.24} />
      </mesh>
      <mesh position={[0, 1.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.025, 10, 28]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={0.34} />
      </mesh>
      <group ref={smoke}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <mesh key={item} position={[0, 1.8 + item * 0.2, 0]}>
            <sphereGeometry args={[0.34, 14, 14]} />
            <meshBasicMaterial color="#dbeafe" transparent opacity={0.1} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HolographicDataField() {
  const field = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!field.current) return;

    const t = clock.getElapsedTime();
    field.current.rotation.y = t * 0.08;
    field.current.children.forEach((ring, index) => {
      ring.scale.setScalar(1 + Math.sin(t * 0.7 + index) * 0.08);
    });
  });

  return (
    <group ref={field} position={[0, 0.34, -1.1]}>
      {[0.9, 1.25, 1.6].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, index * 0.7]}>
          <torusGeometry args={[radius, 0.012, 8, 80]} />
          <meshBasicMaterial
            color={index === 1 ? violet : cyan}
            transparent
            opacity={0.32 - index * 0.05}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive={violet}
          emissiveIntensity={0.46}
          metalness={0.2}
          roughness={0.2}
          transparent
          opacity={0.72}
        />
      </mesh>
    </group>
  );
}

function FactoryCity() {
  const group = useRef<THREE.Group>(null);
  const factoryBlocks = useMemo(
    () => [
      [-7.7, -7.5, 1.7, 2.6, 1.4, cyan],
      [-5.4, -8.35, 1.6, 3.4, 1.35, emerald],
      [-3.0, -7.65, 2.1, 2.55, 1.5, cyan],
      [-0.2, -8.2, 2.4, 3.8, 1.65, violet],
      [2.9, -7.45, 2.0, 2.9, 1.45, cyan],
      [5.8, -8.05, 2.2, 2.35, 1.5, emerald],
      [8.3, -7.6, 1.6, 3.0, 1.35, cyan],
    ],
    []
  );

  useFrame(({ pointer, camera, clock }, delta) => {
    const t = clock.getElapsedTime();

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.x * 0.045 + Math.sin(t * 0.16) * 0.018,
        2.1,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -pointer.y * 0.016,
        2.1,
        delta
      );
    }

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      pointer.x * 0.82 + Math.sin(t * 0.12) * 0.22,
      2,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.55 + pointer.y * 0.3, 2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.25 + Math.cos(t * 0.1) * 0.25, 2, delta);
    camera.lookAt(0, -0.45, -4.7);
  });

  return (
    <group ref={group}>
      <FloorDeck />

      {factoryBlocks.map(([x, z, width, height, depth, accent]) => (
        <FactoryBlock
          key={`${x}-${z}`}
          x={x as number}
          z={z as number}
          width={width as number}
          height={height as number}
          depth={depth as number}
          accent={accent as string}
        />
      ))}

      <group position={[-5.9, -1.54, -4.8]}>
        <StorageTank position={[0, 0, 0]} color={cyan} />
        <StorageTank position={[1.42, 0, -0.2]} color={emerald} />
        <StorageTank position={[2.84, 0, 0.04]} color={violet} />
      </group>

      <group position={[4.6, -1.54, -4.9]}>
        <StorageTank position={[0, 0, 0]} color={emerald} />
        <StorageTank position={[1.45, 0, 0.1]} color={cyan} />
      </group>

      <PipeRun />
      <CraneSystem />
      <AnimatedConveyor />
      <AgvFleet />
      <HolographicDataField />

      <RoboticArm position={[-4.1, -1.54, -1.35]} phase={0.3} />
      <RoboticArm position={[3.6, -1.54, -1.42]} phase={1.8} />
      <RoboticArm position={[0.7, -1.54, -2.9]} phase={3.1} />

      <SmokeStack position={[7.25, -1.58, -7.05]} />
      <SmokeStack position={[-7.1, -1.58, -6.7]} />
      <SmokeStack position={[1.7, -1.58, -7.7]} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#020617", 5.2, 16.5]} />
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.24} color="#bae6fd" />
      <hemisphereLight args={["#dbeafe", "#020617", 0.62]} />
      <directionalLight position={[4, 7, 5]} intensity={1.6} color="#eff6ff" />
      <spotLight position={[-4.8, 4.6, -1.6]} angle={0.42} penumbra={0.72} intensity={9} color={cyan} distance={10} />
      <spotLight position={[5.2, 4.2, -2.4]} angle={0.44} penumbra={0.76} intensity={7.5} color={emerald} distance={10} />
      <pointLight position={[0, 2.4, -1.2]} intensity={3.6} color={violet} distance={6} />
      <pointLight position={[-6, 0.6, -6]} intensity={4.2} color={cyan} distance={5} />
      <pointLight position={[6.2, 0.5, -6.3]} intensity={3.8} color={emerald} distance={5} />
      <Float speed={0.55} rotationIntensity={0.045} floatIntensity={0.08}>
        <FactoryCity />
      </Float>
    </>
  );
}

export default function IndustrialTwinBackground() {
  return (
    <div className="industrial-twin-bg" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 2.55, 6.25], fov: 39, near: 0.1, far: 40 }}
        dpr={[1, 1.35]}
        frameloop="always"
        performance={{ min: 0.65 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <Scene />
      </Canvas>
      <div className="industrial-twin-vignette" />
      <div className="industrial-twin-hud">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
