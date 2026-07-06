"use client";

import { Html } from "@react-three/drei";
import type { MachineDisplayData } from "@/types/machine";

const formatMetric = (value: number | string | undefined, suffix = "") => {
  if (value === undefined || value === null || value === "") {
    return "--";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return `${numericValue.toFixed(1)}${suffix}`;
  }

  return `${value}${suffix}`;
};

export default function MachineLabel({
  machine,
  riskScore,
}: {
  machine: MachineDisplayData;
  riskScore?: number;
}) {
  const prediction = Array.isArray(machine.aiPrediction)
    ? machine.aiPrediction[0] || {}
    : machine.aiPrediction || {};
  const ai = machine.aiIntelligence;
  const anomalySeverity =
    machine.aiAnomalySeverity || ai?.anomaly?.severity || "Low";

  const color =
    machine.status === "Running"
      ? "#22c55e"
      : machine.status === "Warning"
        ? "#facc15"
        : machine.status === "Idle"
          ? "#94a3b8"
          : "#ef4444";

  return (
    <Html position={[0, 0, 0]} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          background: "rgba(2, 6, 23, 0.92)",
          border: `1px solid ${color}`,
          borderRadius: 10,
          boxShadow: `0 0 18px ${color}44`,
          color: "white",
          fontSize: 11,
          lineHeight: 1.35,
          maxWidth: 148,
          minWidth: 138,
          padding: "8px 10px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {machine.name}
        </div>

        <div style={{ color, marginTop: 6 }}>STATUS {machine.status}</div>

        <div>Health: {formatMetric(machine.health, "%")}</div>
        <div>Temp: {formatMetric(machine.temperature, " C")}</div>

        <hr style={{ borderColor: "#334155", margin: "6px 0" }} />

        <div>
          AI Risk:{" "}
          <b>
            {formatMetric(
              machine.aiFailureProbability || ai?.failureProbability,
              "%"
            )}
          </b>
        </div>

        <div>
          RUL:{" "}
          <b>
            {formatMetric(
              machine.aiRemainingUsefulLifeHours ||
                ai?.remainingUsefulLifeHours,
              "h"
            )}
          </b>
        </div>

        <div>
          Anomaly: <b>{anomalySeverity}</b>
        </div>

        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Cause:{" "}
          <b>
            {machine.aiRootCauseSummary ||
              ai?.rootCauseSummary ||
              prediction.failureRisk ||
              "Normal"}
          </b>
        </div>

        <div>
          Score: <b>{riskScore?.toFixed(1) ?? "--"}</b>
        </div>
      </div>
    </Html>
  );
}
