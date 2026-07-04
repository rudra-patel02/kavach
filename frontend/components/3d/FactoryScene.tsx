"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

import Ground from "./Ground";
import Machine from "./Machine";
import MachineLabel from "./MachineLabel";
import StatusLight from "./StatusLight";
import FactoryBuilding from "./FactoryBuilding";
import ConveyorBelt from "./ConveyorBelt";
import Conveyor from "./ConveyorNew";
import Tank from "./Tank";
import Pipe from "./PipeNew";
import Chimney from "./ChimneyNew";
import RobotArm from "./RobotArm";
import Road from "./Road";
import StreetLight from "./StreetLight";

type MachineType = {
  id: number;
  name: string;
  status: string;
};

export default function FactoryScene() {
  const [machines, setMachines] = useState<MachineType[]>([
    { id: 1, name: "Tank", status: "Running" },
    { id: 2, name: "Mixer", status: "Idle" },
    { id: 3, name: "Conveyor", status: "Idle" },
    { id: 4, name: "Packaging", status: "Idle" },
  ]);

  useEffect(() => {
    const states = [
      ["Running", "Idle", "Idle", "Idle"],
      ["Running", "Running", "Idle", "Idle"],
      ["Running", "Running", "Running", "Idle"],
      ["Running", "Running", "Running", "Running"],
      ["Running", "Running", "Idle", "Running"],
      ["Running", "Idle", "Idle", "Running"],
    ];

    const interval = setInterval(() => {
      const step = Math.floor(Date.now() / 3000) % states.length;

      setMachines((prev) =>
        prev.map((machine, index) => ({
          ...machine,
          status: states[step][index],
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [9, 7, 11],
          fov: 45,
        }}
      >
        <color attach="background" args={["#0F172A"]} />

        {/* Lighting */}
        <ambientLight intensity={0.45} color="#94a3b8" />

        <directionalLight
          castShadow
          position={[10, 12, 8]}
          intensity={2.8}
          color="#ffffff"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <pointLight position={[0, 5, 0]} intensity={2} color="#38bdf8" />
        <pointLight position={[3, 3, -2]} intensity={1.5} color="#22c55e" />
        <pointLight position={[-3, 3, -2]} intensity={1.5} color="#f97316" />

        {/* Environment */}
        <Ground />
        <Road />

        {/* Street Lights */}
        <StreetLight position={[-7, 0, 7]} />
        <StreetLight position={[-3, 0, 7]} />
        <StreetLight position={[1, 0, 7]} />
        <StreetLight position={[5, 0, 7]} />

        {/* Factory */}
        <FactoryBuilding />
        <ConveyorBelt />
        <Conveyor running={machines[2]?.status === "Running"} />
        <Tank  running={machines[0]?.status === "Running"}/>
        <Pipe running={machines[1]?.status === "Running"}/>
        <Chimney running={machines.some(
                         (m) => m.status === "Running"
                         )}
        />
        <RobotArm  running={machines[3]?.status === "Running"}/>

        {/* Machines */}
        {machines.map((machine, index) => (
          <group
            key={machine.id}
            position={[index * 3 - 3, 0, -2]}
          >
            <Machine machine={machine} />

            <StatusLight
              position={[0, 1.55, 0]}
              color={
                machine.status === "Running"
                  ? "lime"
                  : machine.status === "Idle"
                  ? "yellow"
                  : machine.status === "Maintenance"
                  ? "orange"
                  : "red"
              }
            />

            <group position={[0, 2.25, 0]}>
              <MachineLabel machine={machine} />
            </group>
          </group>
        ))}

        <OrbitControls
          target={[0, 1, 0]}
          enableRotate
          enableZoom
          enablePan
          minDistance={6}
          maxDistance={18}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}