"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function LightCone({
  color,
  position,
  rotation,
}: {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[1.2, 5.6, 32, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.08}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AnimatedConveyor() {
  const carriers = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!carriers.current) return;

    carriers.current.children.forEach((box) => {
      box.position.x += delta * 0.8;

      if (box.position.x > 4.6) {
        box.position.x = -4.6;
      }
    });
  });

  return (
    <group position={[0, -1.25, -1.1]}>
      <mesh receiveShadow>
        <boxGeometry args={[9.4, 0.18, 0.75]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[9.2, 0.08, 0.58]} />
        <meshStandardMaterial
          color="#0e7490"
          emissive="#0891b2"
          emissiveIntensity={0.22}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
      <group ref={carriers}>
        {[-4.2, -2.1, 0.1, 2.5].map((x, index) => (
          <mesh key={x} castShadow position={[x, 0.45, 0]}>
            <boxGeometry args={[0.52, 0.42, 0.5]} />
            <meshStandardMaterial
              color={index % 2 ? "#67e8f9" : "#34d399"}
              emissive={index % 2 ? "#0891b2" : "#059669"}
              emissiveIntensity={0.28}
              metalness={0.2}
              roughness={0.32}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RoboticArm({ position }: { position: [number, number, number] }) {
  const shoulder = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (shoulder.current) {
      shoulder.current.rotation.z = -0.42 + Math.sin(t * 0.9) * 0.22;
    }

    if (wrist.current) {
      wrist.current.rotation.z = 0.3 + Math.cos(t * 1.2) * 0.18;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.24, 0.34, 0.7, 24]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.65} roughness={0.25} />
      </mesh>
      <group ref={shoulder} position={[0, 0.85, 0]}>
        <mesh castShadow position={[0.55, 0, 0]}>
          <boxGeometry args={[1.15, 0.18, 0.22]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.25} />
        </mesh>
        <group ref={wrist} position={[1.1, 0, 0]}>
          <mesh castShadow position={[0.33, -0.2, 0]}>
            <boxGeometry args={[0.75, 0.14, 0.18]} />
            <meshStandardMaterial color="#f97316" metalness={0.58} roughness={0.28} />
          </mesh>
          <mesh position={[0.74, -0.34, 0.08]}>
            <boxGeometry args={[0.08, 0.32, 0.08]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0.74, -0.34, -0.08]}>
            <boxGeometry args={[0.08, 0.32, 0.08]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function SmokeStack({ position }: { position: [number, number, number] }) {
  const smoke = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!smoke.current) return;

    const t = clock.getElapsedTime();
    smoke.current.children.forEach((cloud, index) => {
      const progress = (t * 0.24 + index * 0.22) % 1;
      const scale = 0.2 + progress * 0.48;

      cloud.position.y = 1.55 + progress * 1.8;
      cloud.position.x = Math.sin(t * 0.65 + index) * 0.16;
      cloud.position.z = Math.cos(t * 0.45 + index) * 0.12;
      cloud.scale.setScalar(scale);
    });
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 1.8, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.28} />
      </mesh>
      <group ref={smoke}>
        {[0, 1, 2, 3, 4].map((item) => (
          <mesh key={item} position={[0, 1.8 + item * 0.22, 0]}>
            <sphereGeometry args={[0.36, 16, 16]} />
            <meshBasicMaterial
              color="#cbd5e1"
              transparent
              opacity={0.12}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function IndustrialFloorRails() {
  return (
    <group position={[0, -1.485, -3.5]}>
      {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map((x) => (
        <mesh key={`rail-${x}`} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.018, 0.018, 6.45]} />
          <meshStandardMaterial
            color="#164e63"
            emissive="#0891b2"
            emissiveIntensity={0.16}
            metalness={0.62}
            roughness={0.3}
          />
        </mesh>
      ))}

      {[-2.6, 0, 2.6].map((z) => (
        <mesh key={`track-${z}`} position={[0, 0.025, z]}>
          <boxGeometry args={[12.2, 0.018, 0.018]} />
          <meshStandardMaterial
            color="#064e3b"
            emissive="#10b981"
            emissiveIntensity={0.12}
            metalness={0.58}
            roughness={0.34}
          />
        </mesh>
      ))}
    </group>
  );
}

function FactoryCity() {
  const group = useRef<THREE.Group>(null);
  const buildingData = useMemo(
    () => [
      [-5.2, -0.9, -4.4, 1.4, 1.8, 1.2],
      [-3.4, -0.65, -4.9, 1.2, 2.4, 1.1],
      [-1.8, -0.82, -4.2, 1.5, 1.95, 1.25],
      [0.1, -0.55, -4.75, 1.7, 2.65, 1.35],
      [2.2, -0.72, -4.35, 1.35, 2.2, 1.1],
      [4.1, -0.95, -4.8, 1.65, 1.75, 1.2],
    ],
    []
  );

  useFrame(({ pointer, camera }, delta) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.x * 0.035,
        2.4,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -pointer.y * 0.018,
        2.4,
        delta
      );
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.75, 2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.3 + pointer.y * 0.34, 2, delta);
    camera.lookAt(0, -0.35, -2.9);
  });

  return (
    <group ref={group}>
      <mesh receiveShadow position={[0, -1.55, -3.5]}>
        <boxGeometry args={[13, 0.08, 7]} />
        <meshStandardMaterial color="#020617" metalness={0.45} roughness={0.52} />
      </mesh>

      <IndustrialFloorRails />

      {buildingData.map(([x, y, z, sx, sy, sz], index) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[sx, sy, sz]} />
            <meshStandardMaterial
              color={index % 2 ? "#0f172a" : "#111827"}
              emissive={index % 2 ? "#083344" : "#064e3b"}
              emissiveIntensity={0.13}
              metalness={0.55}
              roughness={0.34}
            />
          </mesh>
          <mesh position={[0, sy / 2 + 0.035, 0]}>
            <boxGeometry args={[sx * 0.92, 0.06, sz * 0.92]} />
            <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}

      {[-4.1, -0.9, 2.7].map((x, index) => (
        <group key={x} position={[x, -1.1, -2.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.46, 0.46, 1.45 + index * 0.22, 32]} />
            <meshStandardMaterial
              color="#334155"
              emissive="#0e7490"
              emissiveIntensity={0.1}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, 0.78 + index * 0.1, 0]}>
            <torusGeometry args={[0.5, 0.035, 12, 36]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      <group position={[0, -0.45, -3.15]}>
        {[-2.6, 0, 2.6].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 5.4, 24]} />
            <meshStandardMaterial
              color="#0891b2"
              emissive="#22d3ee"
              emissiveIntensity={0.3}
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>
        ))}
      </group>

      <AnimatedConveyor />
      <RoboticArm position={[-3.6, -1.45, -1.2]} />
      <RoboticArm position={[3.3, -1.45, -1.35]} />
      <SmokeStack position={[5.25, -1.5, -4.35]} />
      <SmokeStack position={[-4.65, -1.5, -4.0]} />
      <LightCone color="#22d3ee" position={[-3.8, 1.2, -2.1]} rotation={[0.72, 0.22, -0.4]} />
      <LightCone color="#34d399" position={[3.8, 1.1, -2.0]} rotation={[0.75, -0.18, 0.42]} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#020617", 4.8, 13]} />
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.32} color="#bae6fd" />
      <directionalLight position={[2, 5, 4]} intensity={1.3} color="#e0f2fe" castShadow />
      <pointLight position={[-4, 1.8, -2]} intensity={5} color="#22d3ee" distance={6} />
      <pointLight position={[4, 1.6, -2.6]} intensity={4.2} color="#34d399" distance={6} />
      <pointLight position={[0, 2.2, -1.2]} intensity={3.4} color="#a78bfa" distance={5} />
      <Float speed={0.75} rotationIntensity={0.08} floatIntensity={0.18}>
        <FactoryCity />
      </Float>
    </>
  );
}

export default function IndustrialTwinBackground() {
  return (
    <div className="industrial-twin-bg" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 2.25, 4.9], fov: 42 }}
        dpr={[1, 1.45]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
