"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Factory,
  Gauge,
  HeartPulse,
  PauseCircle,
  ShieldAlert,
  Thermometer,
  TimerReset,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import ExecutiveKPICard from "./ExecutiveKPICard";
import type {
  ExecutiveDashboard as ExecutiveDashboardData,
  ExecutiveMetric,
  ExecutiveMetricKey,
  ExecutiveTrendPoint,
} from "@/types/executive";
import {
  getExecutiveKpiStatus,
  getMetricTrend,
} from "@/utils/executiveKpiStatus";

interface ExecutiveDashboardProps {
  dashboard: ExecutiveDashboardData;
  isRefreshing?: boolean;
}

const buildSyntheticTrend = (value: number, direction = 1): ExecutiveTrendPoint[] => {
  const labels = ["T-5h", "T-4h", "T-3h", "T-2h", "T-1h", "Now"];

  return labels.map((time, index) => ({
    time,
    value: Number(Math.max(0, value + (index - labels.length + 1) * direction).toFixed(1)),
  }));
};

const getTrend = (
  key: ExecutiveMetricKey,
  dashboard: ExecutiveDashboardData,
  fallbackValue: number
) => {
  if (key === "availability" || key === "oee" || key === "health") {
    return dashboard.trends.oee;
  }

  if (key === "downtime") {
    return dashboard.trends.downtime;
  }

  if (key === "energy") {
    return dashboard.trends.energy;
  }

  if (key === "risk") {
    return dashboard.trends.failureProbability;
  }

  return buildSyntheticTrend(fallbackValue, key === "alerts" ? -1 : 1);
};

const metricDefinitions: {
  icon: LucideIcon;
  key: ExecutiveMetricKey;
  label: string;
  unit: string;
  value: (dashboard: ExecutiveDashboardData) => number;
}[] = [
  {
    icon: Activity,
    key: "availability",
    label: "Availability",
    unit: "%",
    value: (dashboard) => dashboard.kpis.availability,
  },
  {
    icon: Gauge,
    key: "oee",
    label: "OEE",
    unit: "%",
    value: (dashboard) => dashboard.kpis.oee,
  },
  {
    icon: HeartPulse,
    key: "health",
    label: "Machine Health",
    unit: "%",
    value: (dashboard) => dashboard.kpis.health,
  },
  {
    icon: Zap,
    key: "energy",
    label: "Energy",
    unit: "kWh",
    value: (dashboard) => dashboard.kpis.energy,
  },
  {
    icon: Thermometer,
    key: "temperature",
    label: "Temperature",
    unit: "C",
    value: (dashboard) => dashboard.kpis.temperature,
  },
  {
    icon: TimerReset,
    key: "downtime",
    label: "Downtime",
    unit: "hrs",
    value: (dashboard) => dashboard.kpis.downtime,
  },
  {
    icon: ShieldAlert,
    key: "risk",
    label: "AI Risk",
    unit: "%",
    value: (dashboard) => dashboard.kpis.risk,
  },
  {
    icon: AlertTriangle,
    key: "alerts",
    label: "Alerts",
    unit: "",
    value: (dashboard) => dashboard.kpis.alerts,
  },
  {
    icon: Factory,
    key: "criticalMachines",
    label: "Critical Machines",
    unit: "",
    value: (dashboard) => dashboard.kpis.criticalMachines,
  },
  {
    icon: BatteryCharging,
    key: "runningMachines",
    label: "Running Machines",
    unit: "",
    value: (dashboard) => dashboard.kpis.runningMachines,
  },
  {
    icon: Wrench,
    key: "maintenanceMachines",
    label: "Maintenance Machines",
    unit: "",
    value: (dashboard) => dashboard.kpis.maintenanceMachines,
  },
  {
    icon: PauseCircle,
    key: "idleMachines",
    label: "Idle Machines",
    unit: "",
    value: (dashboard) => dashboard.kpis.idleMachines,
  },
];

export function ExecutiveDashboardSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="h-44 rounded-xl border border-slate-800 bg-slate-900/85 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
            <div className="h-11 w-11 animate-pulse rounded-lg bg-slate-800" />
          </div>
          <div className="mt-6 h-8 w-24 animate-pulse rounded bg-slate-800" />
          <div className="mt-7 flex items-end justify-between">
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800" />
            <div className="h-8 w-24 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function ExecutiveDashboard({
  dashboard,
  isRefreshing = false,
}: ExecutiveDashboardProps) {
  const metrics = useMemo<ExecutiveMetric[]>(
    () =>
      metricDefinitions.map((definition) => {
        const value = definition.value(dashboard);
        const sparkline = getTrend(definition.key, dashboard, value);
        const trend = getMetricTrend(definition.key, sparkline);

        return {
          key: definition.key,
          label: definition.label,
          value,
          unit: definition.unit,
          status: getExecutiveKpiStatus(definition.key, value),
          sparkline,
          ...trend,
        };
      }),
    [dashboard]
  );

  return (
    <section
      className={`grid grid-cols-1 gap-4 transition-opacity duration-300 md:grid-cols-2 xl:grid-cols-4 ${
        isRefreshing ? "opacity-80" : "opacity-100"
      }`}
    >
      {metrics.map((metric) => {
        const Icon =
          metricDefinitions.find((definition) => definition.key === metric.key)
            ?.icon || Gauge;

        return <ExecutiveKPICard key={metric.key} icon={Icon} metric={metric} />;
      })}
    </section>
  );
}
