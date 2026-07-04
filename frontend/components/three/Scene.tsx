"use client";
import Warehouse from "./Warehouse";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

import Ground from "./Ground";
import Lights from "./Lights";
import Factory from "./Factory";
import Machine from "./Machine";
import Tank from "./Tank";
import Pipe from "./Pipe";
import Conveyor from "./Conveyor";

import socket from "@/lib/socket";
import { fetchMachines } from "@/lib/machines";
import type { MachineData } from "@/types/machine";

export default function Scene() {
  const [machines, setMachines] = useState<MachineData[]>([]);

  useEffect(() => {
    fetchMachines()
      .then((data) => setMachines(data));

    const handleMachineUpdate = (data: MachineData[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-slate-700">
      <Canvas camera={{ position: [8, 6, 8], fov: 45 }}>
        <Lights />

        <Ground />

        <Factory />

        <Warehouse />

        <Tank />

        <Pipe />

        <Conveyor />

        {machines.map((machine, index) => {
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
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
