"use client";

import { Html } from "@react-three/drei";

type MachineData = {
  name?: string;
  status?: string;
  health?: number;
  temperature?: number;
  aiPrediction?: {
    failureRisk?: string;
  };
};

export default function MachineLabel({ machine }: { machine: MachineData }) {
  const statusColor =
    machine.status === "Running"
      ? "#22c55e"
      : machine.status === "Warning"
        ? "#facc15"
        : machine.status === "Critical"
          ? "#ef4444"
          : "#9ca3af";

  return (
    <Html position={[0, 1.6, 0]} center distanceFactor={8} transform>
      <div
        style={{
          minWidth: "170px",
          background: "rgba(15,23,42,0.92)",
          border: `2px solid ${statusColor}`,
          borderRadius: "12px",
          padding: "10px",
          color: "white",
          fontSize: "12px",
          fontFamily: "Arial",
          backdropFilter: "blur(8px)",
          boxShadow: "0 0 15px rgba(0,255,255,0.25)",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          {machine.name}
        </div>

        <div style={{ color: statusColor }}>Status: {machine.status}</div>

        <div>Health: {machine.health?.toFixed(0)}%</div>

        <div>Temp: {machine.temperature?.toFixed(1)} C</div>

        <div>AI: {machine.aiPrediction?.failureRisk ?? "Unknown"}</div>
      </div>
    </Html>
  );
}
