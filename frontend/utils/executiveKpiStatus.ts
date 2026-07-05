import type {
  ExecutiveMetricKey,
  ExecutiveMetricStatus,
  ExecutiveMetricTrend,
  ExecutiveTrendPoint,
} from "@/types/executive";

const positiveMetricKeys = new Set<ExecutiveMetricKey>([
  "availability",
  "oee",
  "health",
  "runningMachines",
]);

const inverseMetricKeys = new Set<ExecutiveMetricKey>([
  "downtime",
  "risk",
  "alerts",
  "criticalMachines",
  "maintenanceMachines",
  "idleMachines",
  "temperature",
  "energy",
]);

export const getExecutiveKpiStatus = (
  key: ExecutiveMetricKey,
  value: number
): ExecutiveMetricStatus => {
  if (key === "availability") {
    if (value > 95) return "good";
    if (value >= 85) return "warning";
    return "critical";
  }

  if (key === "health") {
    if (value > 90) return "good";
    if (value >= 70) return "warning";
    return "critical";
  }

  if (key === "risk") {
    if (value <= 20) return "good";
    if (value <= 50) return "warning";
    return "critical";
  }

  if (key === "oee") {
    if (value >= 85) return "good";
    if (value >= 70) return "warning";
    return "critical";
  }

  if (key === "temperature") {
    if (value <= 65) return "good";
    if (value <= 85) return "warning";
    return "critical";
  }

  if (key === "downtime" || key === "alerts" || key === "criticalMachines") {
    if (value <= 0) return "good";
    if (value <= 3) return "warning";
    return "critical";
  }

  if (key === "maintenanceMachines" || key === "idleMachines") {
    if (value <= 0) return "good";
    if (value <= 4) return "warning";
    return "critical";
  }

  if (key === "energy") {
    if (value <= 450) return "good";
    if (value <= 850) return "warning";
    return "critical";
  }

  return "neutral";
};

export const executiveStatusClasses: Record<ExecutiveMetricStatus, string> = {
  good: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  critical: "border-red-400/25 bg-red-500/10 text-red-200",
  neutral: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
};

export const executiveIndicatorClasses: Record<ExecutiveMetricStatus, string> = {
  good: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  neutral: "bg-cyan-400",
};

export const getMetricTrend = (
  key: ExecutiveMetricKey,
  sparkline: ExecutiveTrendPoint[]
): { trend: ExecutiveMetricTrend; trendValue: number } => {
  const first = sparkline[0]?.value ?? 0;
  const last = sparkline.at(-1)?.value ?? first;
  const delta = Number((last - first).toFixed(1));

  if (Math.abs(delta) < 0.1) {
    return {
      trend: "flat",
      trendValue: 0,
    };
  }

  const rawTrend: ExecutiveMetricTrend = delta > 0 ? "up" : "down";
  const trend =
    inverseMetricKeys.has(key)
      ? rawTrend === "up"
        ? "down"
        : "up"
      : rawTrend;

  return {
    trend,
    trendValue: Math.abs(delta),
  };
};

export const isPositiveMetric = (key: ExecutiveMetricKey) =>
  positiveMetricKeys.has(key);
