"use client";

import { Html } from "@react-three/drei";

export default function MachineLabel({ machine }: any) {
  const prediction = Array.isArray(machine.aiPrediction)
    ? machine.aiPrediction[0] || {}
    : machine.aiPrediction || {};

  const color =
    machine.status === "Running"
      ? "#22c55e"
      : machine.status === "Warning"
      ? "#facc15"
      : "#ef4444";

  return (
    <Html position={[0, 2.2, 0]} center>
      <div
        style={{
          background: "#111827",
          color: "white",
          border: `2px solid ${color}`,
          borderRadius: 12,
          padding: 12,
          minWidth: 180,
          boxShadow: `0 0 15px ${color}`,
        }}
      >
        <b>{machine.name}</b>

        <div style={{ color, marginTop: 6 }}>
          ● {machine.status}
        </div>

        <div>❤️ Health: {machine.health}%</div>
        <div>🌡 Temp: {machine.temperature}°C</div>

        <hr />

        <div>
          🤖 AI Risk:{" "}
          <b>{prediction.failureRisk || "Unknown"}</b>
        </div>

        <div>
          🔧 Priority:{" "}
          <b>{prediction.maintenancePriority || "Unknown"}</b>
        </div>

        <div>
          📅 Days:{" "}
          <b>{prediction.maintenanceInDays ?? "--"}</b>
        </div>
      </div>
    </Html>
  );
}