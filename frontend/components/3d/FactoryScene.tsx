"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo, useState } from "react";

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
import type { EnterpriseMachineProfile } from "@/lib/enterpriseAnalytics";
import type { MachineDisplayData, MachineStatus } from "@/types/machine";

type MachineType = {
  id: number;
  machineId: string;
  name: string;
  status: MachineStatus;
  health?: number;
  temperature?: number;
  vibration?: number;
  department?: string;
  profile?: EnterpriseMachineProfile;
};

interface FactorySceneProps {
  profiles?: EnterpriseMachineProfile[];
  selectedMachineId?: string | null;
  onMachineSelect?: (profile: EnterpriseMachineProfile) => void;
}

const fallbackMachines: MachineType[] = [
  { id: 1, machineId: "DEMO-01", name: "Tank", status: "Running", health: 96 },
  { id: 2, machineId: "DEMO-02", name: "Mixer", status: "Idle", health: 82 },
  { id: 3, machineId: "DEMO-03", name: "Conveyor", status: "Idle", health: 76 },
  { id: 4, machineId: "DEMO-04", name: "Packaging", status: "Idle", health: 88 },
];

const positions: [number, number, number][] = [
  [-5.2, 0, -2.4],
  [-2.6, 0, -2.1],
  [0, 0, -2.2],
  [2.7, 0, -2],
  [5.2, 0, -2.35],
];

const getStatusColor = (status: MachineStatus | undefined) => {
  if (status === "Running") return "lime";
  if (status === "Warning") return "yellow";
  if (status === "Maintenance") return "orange";
  if (status === "Idle") return "#94a3b8";
  if (status === "Offline") return "#64748b";
  return "red";
};

const getSceneMachine = (machine: MachineType): MachineDisplayData => ({
  name: machine.name,
  status: machine.status,
  health: machine.health,
  temperature: machine.temperature,
  aiPrediction: machine.profile?.machine.aiPrediction,
  aiIntelligence: machine.profile?.ai || machine.profile?.machine.aiIntelligence,
  aiFailureProbability:
    machine.profile?.ai?.failureProbability ||
    machine.profile?.machine.aiFailureProbability,
  aiRemainingUsefulLifeHours:
    machine.profile?.ai?.remainingUsefulLifeHours ||
    machine.profile?.machine.aiRemainingUsefulLifeHours,
  aiRootCauseSummary:
    machine.profile?.ai?.rootCauseSummary ||
    machine.profile?.machine.aiRootCauseSummary,
  aiAnomalySeverity:
    machine.profile?.ai?.anomaly?.severity ||
    machine.profile?.machine.aiAnomalySeverity,
});

const formatMachineMetric = (
  value: number | string | undefined,
  suffix = ""
) => {
  if (value === undefined || value === null || value === "") {
    return "--";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return `${numericValue.toFixed(1)}${suffix}`;
  }

  return `${value}${suffix}`;
};

export default function FactoryScene({
  profiles = [],
  selectedMachineId,
  onMachineSelect,
}: FactorySceneProps) {
  const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);
  const machines = useMemo<MachineType[]>(
    () =>
      profiles.length > 0
        ? profiles.map((profile, index) => ({
            id: index + 1,
            machineId: profile.machine.machineId,
            name: profile.machine.name,
            status: profile.machine.status,
            health: profile.machine.health,
            temperature: profile.machine.temperature,
            vibration: profile.machine.vibration,
            department: profile.machine.department,
            profile,
          }))
        : fallbackMachines,
    [profiles]
  );
  const isPlantRunning = machines.some((machine) => machine.status === "Running");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 520,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{
          position: [9, 7, 11],
          fov: 45,
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        shadows
      >
        <color attach="background" args={["#0F172A"]} />

        {/* Lighting */}
        <ambientLight intensity={0.45} color="#94a3b8" />

        <directionalLight
          castShadow
          position={[10, 12, 8]}
          intensity={2.8}
          color="#ffffff"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
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
        <ConveyorBelt running={isPlantRunning} />
        <Conveyor running={machines[2]?.status === "Running"} />
        <Tank running={machines[0]?.status === "Running"} />
        <Pipe running={isPlantRunning} />
        <Chimney running={isPlantRunning} />
        <RobotArm running={machines[3]?.status === "Running"} />

        {/* Machines */}
        {machines.map((machine, index) => (
          <group
            key={machine.machineId}
            position={positions[index] || [index * 2.6 - 5.2, 0, -2]}
            onClick={(event) => {
              event.stopPropagation();

              if (machine.profile) {
                onMachineSelect?.(machine.profile);
              }
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredMachineId(machine.machineId);
              document.body.style.cursor = machine.profile ? "pointer" : "default";
            }}
            onPointerOut={() => {
              setHoveredMachineId(null);
              document.body.style.cursor = "default";
            }}
          >
            <Machine
              machine={getSceneMachine(machine)}
              selected={selectedMachineId === machine.machineId}
              hovered={hoveredMachineId === machine.machineId}
            />

            <StatusLight
              position={[0, 1.55, 0]}
              color={getStatusColor(machine.status)}
              intensity={machine.status === "Critical" ? 4 : 2}
              size={machine.status === "Critical" ? 0.12 : 0.08}
            />

            <group position={[0, 2.15, 0]}>
              <MachineLabel
                machine={getSceneMachine(machine)}
                riskScore={machine.profile?.riskScore}
              />
            </group>

            {hoveredMachineId === machine.machineId ? (
              <Html position={[0, 3.05, 0]} center style={{ pointerEvents: "none" }}>
                <div className="w-56 rounded-xl border border-cyan-400/30 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-2xl shadow-black/40">
                  <div className="font-bold text-white">{machine.name}</div>
                  <div className="mt-1 text-slate-400">
                    {machine.machineId} - {machine.department || "Production"}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <span>
                      Health {formatMachineMetric(machine.profile?.ai?.healthPercent || machine.health, "%")}
                    </span>
                    <span>Temp {formatMachineMetric(machine.temperature, " C")}</span>
                    <span>Vib {formatMachineMetric(machine.vibration)}</span>
                    <span>
                      AI Risk {formatMachineMetric(machine.profile?.ai?.riskPercent || machine.profile?.riskScore, "%")}
                    </span>
                    <span>
                      RUL {formatMachineMetric(machine.profile?.ai?.remainingUsefulLifeHours || machine.profile?.remainingUsefulLifeHours, "h")}
                    </span>
                    <span>
                      Fail {formatMachineMetric(machine.profile?.ai?.failureProbability || machine.profile?.failureProbability, "%")}
                    </span>
                  </div>
                  <div className="mt-2 text-cyan-200">
                    {machine.profile?.ai?.anomaly?.severity || "Low"} anomaly
                  </div>
                  <div className="mt-1 line-clamp-2 text-slate-400">
                    {machine.profile?.ai?.rootCauseSummary || "No root cause active"}
                  </div>
                </div>
              </Html>
            ) : null}
          </group>
        ))}

        <OrbitControls
          target={[0, 1, 0]}
          enableRotate
          enableZoom
          enablePan
          enableDamping
          dampingFactor={0.08}
          minDistance={6}
          maxDistance={18}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}
