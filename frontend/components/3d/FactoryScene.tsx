"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
  showSensorOverlays?: boolean;
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

const getSeverityColor = (profile?: EnterpriseMachineProfile) => {
  const status = profile?.machine.status;
  const severity = profile?.ai?.anomaly?.severity || profile?.machine.aiAnomalySeverity;
  const risk = Number(profile?.riskScore || profile?.failureProbability || 0);

  if (status === "Critical" || severity === "Critical" || risk >= 80) {
    return "#ef4444";
  }

  if (status === "Warning" || severity === "High" || risk >= 60) {
    return "#f97316";
  }

  if (severity === "Medium" || risk >= 35) {
    return "#facc15";
  }

  return "#22c55e";
};

const ProductionFlow = ({ running }: { running: boolean }) => {
  const points = useMemo(
    () => [
      new THREE.Vector3(-5.2, 0.82, -0.85),
      new THREE.Vector3(-2.6, 0.82, -0.85),
      new THREE.Vector3(0, 0.82, -0.85),
      new THREE.Vector3(2.7, 0.82, -0.85),
      new THREE.Vector3(5.2, 0.82, -0.85),
    ],
    []
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.025, 8, false), [curve]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#0891b2"
          emissiveIntensity={running ? 1.1 : 0.25}
          transparent
          opacity={running ? 0.72 : 0.3}
        />
      </mesh>
      {[0, 0.2, 0.4, 0.6, 0.8].map((offset) => (
        <FlowPulse key={offset} curve={curve} offset={offset} running={running} />
      ))}
    </group>
  );
};

const FlowPulse = ({
  curve,
  offset,
  running,
}: {
  curve: THREE.CatmullRomCurve3;
  offset: number;
  running: boolean;
}) => {
  const ref = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !running) {
      return;
    }

    const point = curve.getPoint((clock.getElapsedTime() * 0.12 + offset) % 1);
    ref.current.position.copy(point);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 18, 18]} />
      <meshStandardMaterial
        color="#67e8f9"
        emissive="#22d3ee"
        emissiveIntensity={1.8}
      />
    </mesh>
  );
};

const AlarmMarker = ({ profile }: { profile?: EnterpriseMachineProfile }) => {
  const alarmCount = (profile?.criticalAlerts.length || 0) + (profile?.openWorkOrders.length || 0);

  if (!profile || alarmCount === 0) {
    return null;
  }

  return (
    <Html position={[0.62, 2.45, 0]} center style={{ pointerEvents: "none" }}>
      <div className="flex h-8 min-w-8 items-center justify-center rounded-full border border-red-300/50 bg-red-500/90 px-2 text-xs font-black text-white shadow-xl shadow-red-950/50">
        {alarmCount}
      </div>
    </Html>
  );
};

const SensorOverlay = ({ machine }: { machine: MachineType }) => {
  if (!machine.profile) {
    return null;
  }

  const profile = machine.profile;

  return (
    <Html position={[0, 2.72, 0]} center style={{ pointerEvents: "none" }}>
      <div className="w-48 rounded-xl border border-slate-700/80 bg-slate-950/86 p-2 text-[11px] text-slate-300 shadow-2xl shadow-black/35 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-bold text-white">{machine.name}</span>
          <span style={{ color: getSeverityColor(profile) }} className="font-black">
            {machine.status}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <span>T {formatMachineMetric(machine.temperature, "C")}</span>
          <span>V {formatMachineMetric(machine.vibration)}</span>
          <span>H {formatMachineMetric(machine.health, "%")}</span>
          <span>R {formatMachineMetric(profile.riskScore, "%")}</span>
          <span>F {formatMachineMetric(profile.failureProbability, "%")}</span>
          <span>O {profile.openWorkOrders.length}</span>
        </div>
      </div>
    </Html>
  );
};

export default function FactoryScene({
  profiles = [],
  selectedMachineId,
  onMachineSelect,
  showSensorOverlays = true,
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
  const selectedMachine = machines.find((machine) => machine.machineId === selectedMachineId);

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
        dpr={[1, 1.25]}
        performance={{ debounce: 240, min: 0.6 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0F172A"]} />

        {/* Lighting */}
        <ambientLight intensity={0.45} color="#94a3b8" />

        <directionalLight
          position={[10, 12, 8]}
          intensity={2.8}
          color="#ffffff"
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
        <ProductionFlow running={isPlantRunning} />

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
            <AlarmMarker profile={machine.profile} />
            {showSensorOverlays || selectedMachineId === machine.machineId ? (
              <SensorOverlay machine={machine} />
            ) : null}

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

        {selectedMachine?.profile ? (
          <Html position={[0, 4.8, 2.6]} center style={{ pointerEvents: "none" }}>
            <div className="w-80 rounded-2xl border border-cyan-400/30 bg-slate-950/92 p-4 text-xs text-slate-300 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">
                    {selectedMachine.profile.machine.name}
                  </div>
                  <div className="mt-1 text-slate-500">
                    {selectedMachine.profile.machine.machineId}
                  </div>
                </div>
                <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 font-bold text-cyan-100">
                  Digital Twin Link
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-slate-500">Risk</div>
                  <div className="font-bold text-white">{formatMachineMetric(selectedMachine.profile.riskScore, "%")}</div>
                </div>
                <div>
                  <div className="text-slate-500">RUL</div>
                  <div className="font-bold text-white">{formatMachineMetric(selectedMachine.profile.remainingUsefulLifeHours, "h")}</div>
                </div>
                <div>
                  <div className="text-slate-500">Alarms</div>
                  <div className="font-bold text-white">{selectedMachine.profile.criticalAlerts.length}</div>
                </div>
              </div>
            </div>
          </Html>
        ) : null}

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
