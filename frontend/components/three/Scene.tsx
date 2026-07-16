"use client";
import Warehouse from "./Warehouse";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import Ground from "./Ground";
import Lights from "./Lights";
import Factory from "./Factory";
import Machine from "./Machine";
import Tank from "./Tank";
import Pipe from "./Pipe";
import Conveyor from "./Conveyor";

import { useMemo } from "react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

export default function Scene() {
  const machines = useMachineFeed();
  const visibleMachines = useMemo(() => machines.slice(0, 5), [machines]);

  return (
    <div className="premium-card chart-frame h-[520px] w-full overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-xl border border-cyan-300/20 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
          Digital Twin
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Factory telemetry layer
        </p>
      </div>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        performance={{ min: 0.5 }}
      >
        <Lights />

        <Ground />

        <Factory />

        <Warehouse />

        <Tank />

        <Pipe />

        <Conveyor />

        {visibleMachines.map((machine, index) => {
          const positions: [number, number, number][] = [
  [1, 0.5, 1],
  [-1, 0.5, -1],
  [2.5, 0.5, -1],
  [-2.5, 0.5, 2],
  [0, 0.5, -3],
];

          return (
            <Machine
              key={machine.machineId}
             position={positions[index] ?? ([0, 0.5, 0] as [number, number, number])}
              machine={machine}
            />
          );
        })}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
