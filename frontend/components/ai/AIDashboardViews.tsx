"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cpu,
  Factory,
  Gauge,
  HeartPulse,
  ListChecks,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  analyzeMachineAI,
  fetchAIOverview,
  fetchMachineAI,
  generateMaintenancePlan,
} from "@/lib/ai";
import socket, { SOCKET_EVENTS } from "@/lib/socket";
import type {
  AIForecastChartPoint,
  AIMachineIntelligence,
  AIMachineSummary,
  AIOverview,
  AIRecommendation,
  AISeverity,
} from "@/types/ai";

const aiNavItems = [
  { href: "/ai", label: "AI Overview" },
  { href: "/ai/machine-intelligence", label: "Machine Intelligence" },
  { href: "/ai/failure-forecast", label: "Failure Forecast" },
  { href: "/ai/maintenance-planner", label: "Maintenance Planner" },
  { href: "/ai/root-cause", label: "Root Cause Explorer" },
  { href: "/ai/fleet-health", label: "Fleet Health" },
  { href: "/ai/executive-insights", label: "Executive Insights" },
];

const severityBadgeClass: Record<AISeverity, string> = {
  Low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  Medium: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  High: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  Critical: "border-red-400/30 bg-red-500/10 text-red-200",
};

const severityColor: Record<AISeverity, string> = {
  Low: "#34d399",
  Medium: "#fbbf24",
  High: "#fb923c",
  Critical: "#f87171",
};

const failureLabels: Record<keyof AIForecastChartPoint, string> = {
  horizon: "Horizon",
  motorFailure: "Motor",
  bearingFailure: "Bearing",
  pumpFailure: "Pump",
  hydraulicFailure: "Hydraulic",
  electricalFailure: "Electrical",
  coolingFailure: "Cooling",
};

const failureColors = {
  motorFailure: "#38bdf8",
  bearingFailure: "#f97316",
  pumpFailure: "#22c55e",
  hydraulicFailure: "#a78bfa",
  electricalFailure: "#eab308",
  coolingFailure: "#ef4444",
};

const formatNumber = (value?: number, unit = "", digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `--${unit}`;
  }

  return `${number.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}${unit}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
};

const shortMachineName = (machine: AIMachineSummary) =>
  machine.machine.name.length > 16
    ? `${machine.machine.name.slice(0, 14)}..`
    : machine.machine.name;

function useAIOverviewData() {
  const [overview, setOverview] = useState<AIOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<number | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetchAIOverview();
      setOverview(response.overview);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load AI overview"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadOverview]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshRef.current) {
        window.clearTimeout(refreshRef.current);
      }

      setIsRefreshing(true);
      refreshRef.current = window.setTimeout(() => {
        void loadOverview();
      }, 350);
    };

    socket.on(SOCKET_EVENTS.AI_INTELLIGENCE_UPDATE, scheduleRefresh);
    socket.on(SOCKET_EVENTS.AI_ANOMALY, scheduleRefresh);
    socket.on(SOCKET_EVENTS.AI_FORECAST_UPDATE, scheduleRefresh);
    socket.on(SOCKET_EVENTS.AI_MAINTENANCE_PLAN, scheduleRefresh);

    return () => {
      socket.off(SOCKET_EVENTS.AI_INTELLIGENCE_UPDATE, scheduleRefresh);
      socket.off(SOCKET_EVENTS.AI_ANOMALY, scheduleRefresh);
      socket.off(SOCKET_EVENTS.AI_FORECAST_UPDATE, scheduleRefresh);
      socket.off(SOCKET_EVENTS.AI_MAINTENANCE_PLAN, scheduleRefresh);

      if (refreshRef.current) {
        window.clearTimeout(refreshRef.current);
      }
    };
  }, [loadOverview]);

  return {
    overview,
    isLoading,
    isRefreshing,
    error,
    reload: loadOverview,
  };
}

function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  isRefreshing,
  onRefresh,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
          <Icon size={18} />
          {eyebrow}
        </div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-400">{description}</p>
      </div>

      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
        >
          {isRefreshing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCcw size={16} />
          )}
          Refresh AI
        </button>
      ) : null}
    </section>
  );
}

function AISectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/70 p-2">
      {aiNavItems.map((item) => {
        const active = item.href === "/ai" ? pathname === "/ai" : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-cyan-500/15 text-cyan-200"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/75">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-cyan-300" size={42} />
        <p className="mt-4 font-semibold text-white">Loading AI intelligence</p>
        <p className="mt-2 text-sm text-slate-400">Reading decision records</p>
      </div>
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-400/30 bg-red-950/30 p-6 text-red-100">
      <p className="font-semibold">AI intelligence unavailable</p>
      <p className="mt-2 text-sm text-red-100/80">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-50"
      >
        Retry
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: "amber" | "cyan" | "emerald" | "red" | "violet";
}) {
  const toneClass = {
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    red: "border-red-400/25 bg-red-500/10 text-red-200",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  }[tone];

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

const getThirtyDayForecast = (machine: AIMachineSummary) =>
  machine.forecast.probabilityChart.find((point) => point.horizon === "30 Days") ||
  machine.forecast.probabilityChart.at(-1);

const buildFailureProbabilityData = (machines: AIMachineSummary[]) =>
  machines.slice(0, 10).map((machine) => {
    const point = getThirtyDayForecast(machine);

    return {
      name: shortMachineName(machine),
      peak: machine.failureProbability,
      motorFailure: point?.motorFailure || 0,
      bearingFailure: point?.bearingFailure || 0,
      pumpFailure: point?.pumpFailure || 0,
    };
  });

const buildRulData = (machines: AIMachineSummary[]) =>
  machines.slice(0, 10).map((machine) => ({
    name: shortMachineName(machine),
    hours: machine.remainingUsefulLifeHours,
    days: machine.remainingUsefulLifeDays,
  }));

const buildHealthData = (machines: AIMachineSummary[]) =>
  machines.slice(0, 10).map((machine) => ({
    name: shortMachineName(machine),
    health: machine.healthPercent,
    risk: machine.riskPercent,
  }));

const buildAnomalyData = (machines: AIMachineSummary[]) =>
  machines.slice(0, 10).map((machine) => ({
    name: shortMachineName(machine),
    score: machine.anomaly.severityScore,
    severity: machine.anomaly.severity,
  }));

const buildCostData = (machines: AIMachineSummary[]) =>
  machines.slice(0, 10).map((machine) => ({
    name: shortMachineName(machine),
    cost: machine.maintenancePlan.estimatedCost || 0,
    downtime: machine.maintenancePlan.estimatedDowntimeHours || 0,
  }));

const buildRiskMatrixData = (machines: AIMachineSummary[]) =>
  machines.map((machine) => ({
    name: machine.machine.name,
    failureProbability: machine.failureProbability,
    health: machine.healthPercent,
    risk: machine.riskPercent,
    severity: machine.anomaly.severity,
  }));

function FailureProbabilityChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="Failure Probability">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buildFailureProbabilityData(machines)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" unit="%" />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Bar dataKey="peak" fill="#ef4444" isAnimationActive={false} radius={[6, 6, 0, 0]} />
          <Bar dataKey="bearingFailure" fill="#f97316" isAnimationActive={false} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function RulTrendChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="RUL Trend">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={buildRulData(machines)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" unit="h" />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Area
            dataKey="hours"
            fill="#38bdf8"
            fillOpacity={0.22}
            isAnimationActive={false}
            stroke="#38bdf8"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function HealthTrendChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="Health Trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={buildHealthData(machines)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" unit="%" />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Line dataKey="health" dot isAnimationActive={false} stroke="#22c55e" strokeWidth={3} type="monotone" />
          <Line dataKey="risk" dot isAnimationActive={false} stroke="#f97316" strokeWidth={3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function AnomalyTimelineChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="Anomaly Timeline">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buildAnomalyData(machines)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Bar dataKey="score" isAnimationActive={false} radius={[6, 6, 0, 0]}>
            {buildAnomalyData(machines).map((entry) => (
              <Cell key={entry.name} fill={severityColor[entry.severity]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function MaintenanceCostChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="Maintenance Cost Forecast">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buildCostData(machines)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Bar dataKey="cost" fill="#a78bfa" isAnimationActive={false} radius={[6, 6, 0, 0]} />
          <Bar dataKey="downtime" fill="#f59e0b" isAnimationActive={false} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function RiskMatrixChart({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <ChartPanel title="Risk Matrix">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis
            dataKey="failureProbability"
            name="Failure"
            stroke="#94a3b8"
            unit="%"
            type="number"
          />
          <YAxis
            dataKey="health"
            name="Health"
            stroke="#94a3b8"
            unit="%"
            type="number"
          />
          <ZAxis dataKey="risk" range={[90, 420]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Scatter data={buildRiskMatrixData(machines)} isAnimationActive={false}>
            {buildRiskMatrixData(machines).map((entry) => (
              <Cell key={entry.name} fill={severityColor[entry.severity]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function RecommendationList({
  recommendations,
}: {
  recommendations: AIRecommendation[];
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">AI Decision Engine</h2>
        <BrainCircuit size={22} className="text-cyan-300" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {recommendations.slice(0, 8).map((item, index) => (
          <article
            key={`${item.machineId || "fleet"}-${item.recommendation}-${index}`}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.recommendation}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {item.machineName || "Fleet"} / {item.priority}
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                {formatNumber(item.confidence, "%", 1)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.rationale}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.expectedImpact}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MachineTable({ machines }: { machines: AIMachineSummary[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
      <h2 className="text-xl font-bold text-white">Machine Intelligence</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
              <th className="px-3 py-3">Machine</th>
              <th className="px-3 py-3">Health</th>
              <th className="px-3 py-3">RUL</th>
              <th className="px-3 py-3">Failure</th>
              <th className="px-3 py-3">Anomaly</th>
              <th className="px-3 py-3">Root Cause</th>
              <th className="px-3 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr
                key={machine.machine.machineId}
                className="border-b border-slate-800/70 hover:bg-slate-800/35"
              >
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-cyan-300">
                      <Cpu size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{machine.machine.name}</p>
                      <p className="text-xs text-slate-400">
                        {machine.machine.machineId} / {machine.machine.department}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-emerald-200">
                  {formatNumber(machine.healthPercent, "%", 1)}
                </td>
                <td className="px-3 py-4 text-cyan-200">
                  {formatNumber(machine.remainingUsefulLifeHours, "h", 0)}
                </td>
                <td className="px-3 py-4 text-orange-200">
                  {formatNumber(machine.failureProbability, "%", 1)}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityBadgeClass[machine.anomaly.severity]}`}
                  >
                    {machine.anomaly.severity}
                  </span>
                </td>
                <td className="max-w-xs px-3 py-4 text-slate-300">
                  {machine.rootCauseSummary}
                </td>
                <td className="px-3 py-4 text-cyan-200">
                  {formatNumber(machine.confidencePercent, "%", 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AIPageFrame({
  children,
  description,
  eyebrow,
  error,
  icon,
  isLoading,
  isRefreshing,
  onRefresh,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  error: string | null;
  icon: ComponentType<{ size?: number; className?: string }>;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  title: string;
}) {
  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <PageHeader
          description={description}
          eyebrow={eyebrow}
          icon={icon}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          title={title}
        />
        <AISectionNav />
        {isLoading ? <LoadingPanel /> : error ? <ErrorPanel error={error} onRetry={onRefresh} /> : children}
      </div>
    </DashboardLayout>
  );
}

export function AIOverviewPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = overview?.machines || [];

  return (
    <AIPageFrame
      description="AI anomaly detection, RUL, root cause, forecast, maintenance planning, and executive recommendations across the plant."
      eyebrow="AI Overview"
      error={error}
      icon={BrainCircuit}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Industrial AI Decision Intelligence"
    >
      {overview ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              detail="Assets under AI assessment"
              icon={Factory}
              label="Machines"
              value={overview.summary.totalMachines}
            />
            <MetricCard
              detail="Fleet AI health score"
              icon={HeartPulse}
              label="Avg Health"
              tone="emerald"
              value={formatNumber(overview.summary.averageHealth, "%", 1)}
            />
            <MetricCard
              detail="Composite decision risk"
              icon={Gauge}
              label="Avg Risk"
              tone="amber"
              value={formatNumber(overview.summary.averageRisk, "%", 1)}
            />
            <MetricCard
              detail="High-risk or severe assets"
              icon={ShieldAlert}
              label="High Risk"
              tone="red"
              value={overview.summary.highRiskMachines}
            />
            <MetricCard
              detail="Critical anomaly severity"
              icon={AlertTriangle}
              label="Critical"
              tone="red"
              value={overview.summary.criticalMachines}
            />
            <MetricCard
              detail="Active executive actions"
              icon={ListChecks}
              label="Actions"
              tone="violet"
              value={overview.recommendations.length}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <FailureProbabilityChart machines={machines} />
            <RulTrendChart machines={machines} />
            <HealthTrendChart machines={machines} />
            <AnomalyTimelineChart machines={machines} />
            <MaintenanceCostChart machines={machines} />
            <RiskMatrixChart machines={machines} />
          </section>

          <MachineTable machines={machines} />
          <RecommendationList recommendations={overview.recommendations} />
        </>
      ) : null}
    </AIPageFrame>
  );
}

function MachineSelector({
  machines,
  selectedMachineId,
  onSelect,
}: {
  machines: AIMachineSummary[];
  selectedMachineId: string | null;
  onSelect: (machineId: string) => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {machines.map((machine) => {
        const active = selectedMachineId === machine.machine.machineId;

        return (
          <button
            key={machine.machine.machineId}
            type="button"
            onClick={() => onSelect(machine.machine.machineId)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              active
                ? "border-cyan-400/40 bg-cyan-500/15"
                : "border-slate-800 bg-slate-900/75 hover:bg-slate-800/70"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{machine.machine.name}</p>
                <p className="mt-1 text-xs text-slate-400">{machine.machine.machineId}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityBadgeClass[machine.anomaly.severity]}`}
              >
                {machine.anomaly.severity}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <span>Health {formatNumber(machine.healthPercent, "%", 0)}</span>
              <span>Risk {formatNumber(machine.riskPercent, "%", 0)}</span>
              <span>RUL {formatNumber(machine.remainingUsefulLifeHours, "h", 0)}</span>
            </div>
          </button>
        );
      })}
    </section>
  );
}

export function MachineIntelligencePageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = useMemo(() => overview?.machines || [], [overview?.machines]);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AIMachineIntelligence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const currentSelectedMachineId =
    selectedMachineId || machines[0]?.machine.machineId || null;

  useEffect(() => {
    if (!currentSelectedMachineId) {
      return;
    }

    let mounted = true;

    fetchMachineAI(currentSelectedMachineId)
      .then((response) => {
        if (mounted) {
          setDetail(response.intelligence);
        }
      })
      .catch(() => {
        if (mounted) {
          setDetail(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentSelectedMachineId, overview?.generatedAt]);

  const current =
    detail?.current ||
    machines.find(
      (machine) => machine.machine.machineId === currentSelectedMachineId
    ) ||
    null;

  const runAnalysis = async () => {
    if (!currentSelectedMachineId) {
      return;
    }

    setIsAnalyzing(true);

    try {
      await analyzeMachineAI(currentSelectedMachineId);
      await reload();
      const response = await fetchMachineAI(currentSelectedMachineId);
      setDetail(response.intelligence);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AIPageFrame
      description="Machine-level anomaly, root-cause, RUL, confidence, forecast, and action intelligence."
      eyebrow="Machine Intelligence"
      error={error}
      icon={Cpu}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Machine Intelligence"
    >
      <MachineSelector
        machines={machines}
        onSelect={setSelectedMachineId}
        selectedMachineId={currentSelectedMachineId}
      />

      {current ? (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <MetricCard
                detail={current.anomaly.reason}
                icon={AlertTriangle}
                label="Anomaly"
                tone={current.anomaly.severity === "Critical" ? "red" : "amber"}
                value={current.anomaly.severity}
              />
              <MetricCard
                detail="Remaining useful life"
                icon={Clock}
                label="RUL"
                value={formatNumber(current.remainingUsefulLifeHours, "h", 0)}
              />
              <MetricCard
                detail="Peak forecast probability"
                icon={TrendingUp}
                label="Failure"
                tone="red"
                value={formatNumber(current.failureProbability, "%", 1)}
              />
              <MetricCard
                detail="AI confidence score"
                icon={CheckCircle2}
                label="Confidence"
                tone="emerald"
                value={formatNumber(current.confidencePercent, "%", 1)}
              />
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {current.machine.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {current.machine.machineId} / {current.machine.department} / last AI run {formatDateTime(current.generatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void runAnalysis()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-60"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                  Analyze Now
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {current.topRootCauses.slice(0, 3).map((cause) => (
                  <article
                    key={cause.cause}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <p className="font-semibold text-white">{cause.cause}</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-200">
                      {formatNumber(cause.probability, "%", 1)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {cause.explanation}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {detail?.trends.length ? (
              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartPanel title="Machine Health Trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.trends}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" hide />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #334155",
                          borderRadius: 8,
                          color: "#e2e8f0",
                        }}
                      />
                      <Line dataKey="health" isAnimationActive={false} stroke="#22c55e" strokeWidth={3} type="monotone" />
                      <Line dataKey="risk" isAnimationActive={false} stroke="#f97316" strokeWidth={3} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>
                <ChartPanel title="RUL Trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={detail.trends}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" hide />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #334155",
                          borderRadius: 8,
                          color: "#e2e8f0",
                        }}
                      />
                      <Area
                        dataKey="remainingUsefulLifeHours"
                        fill="#38bdf8"
                        fillOpacity={0.18}
                        isAnimationActive={false}
                        stroke="#38bdf8"
                        strokeWidth={3}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </section>
            ) : null}
          </div>

          <aside className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-xl font-bold text-white">Decision Actions</h2>
            <div className="mt-5 space-y-3">
              {current.recommendations.map((recommendation) => (
                <div
                  key={recommendation.recommendation}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">
                      {recommendation.recommendation}
                    </p>
                    <span className="text-sm font-bold text-cyan-200">
                      {formatNumber(recommendation.confidence, "%", 1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {recommendation.rationale}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      ) : null}
    </AIPageFrame>
  );
}

export function FailureForecastPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = useMemo(() => overview?.machines || [], [overview?.machines]);
  const selected = machines[0];
  const forecastRows = useMemo(
    () =>
      machines.flatMap((machine) =>
        machine.forecast.probabilityChart.map((point) => ({
          machine: machine.machine.name,
          ...point,
        }))
      ),
    [machines]
  );

  return (
    <AIPageFrame
      description="24-hour, 7-day, and 30-day probability forecasts by failure mode."
      eyebrow="Failure Forecast"
      error={error}
      icon={TrendingUp}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Failure Forecast"
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ChartPanel title="Fleet Forecast Probability">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildFailureProbabilityData(machines)}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" unit="%" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="motorFailure" fill={failureColors.motorFailure} isAnimationActive={false} radius={[6, 6, 0, 0]} />
              <Bar dataKey="bearingFailure" fill={failureColors.bearingFailure} isAnimationActive={false} radius={[6, 6, 0, 0]} />
              <Bar dataKey="pumpFailure" fill={failureColors.pumpFailure} isAnimationActive={false} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
          <h2 className="text-xl font-bold text-white">Failure Modes</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(failureColors).map(([key, color]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3"
              >
                <span className="flex items-center gap-3 text-sm text-slate-300">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {failureLabels[key as keyof AIForecastChartPoint]}
                </span>
                <span className="text-sm font-semibold text-white">
                  {selected
                    ? formatNumber(
                        getThirtyDayForecast(selected)?.[
                          key as keyof Omit<AIForecastChartPoint, "horizon">
                        ] as number,
                        "%",
                        1
                      )
                    : "--"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
        <h2 className="text-xl font-bold text-white">Forecast Table</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="px-3 py-3">Machine</th>
                <th className="px-3 py-3">Horizon</th>
                <th className="px-3 py-3">Motor</th>
                <th className="px-3 py-3">Bearing</th>
                <th className="px-3 py-3">Pump</th>
                <th className="px-3 py-3">Hydraulic</th>
                <th className="px-3 py-3">Electrical</th>
                <th className="px-3 py-3">Cooling</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.map((row, index) => (
                <tr key={`${row.machine}-${row.horizon}-${index}`} className="border-b border-slate-800/70">
                  <td className="px-3 py-4 font-semibold text-white">{row.machine}</td>
                  <td className="px-3 py-4 text-cyan-200">{row.horizon}</td>
                  <td className="px-3 py-4">{formatNumber(row.motorFailure, "%", 1)}</td>
                  <td className="px-3 py-4">{formatNumber(row.bearingFailure, "%", 1)}</td>
                  <td className="px-3 py-4">{formatNumber(row.pumpFailure, "%", 1)}</td>
                  <td className="px-3 py-4">{formatNumber(row.hydraulicFailure, "%", 1)}</td>
                  <td className="px-3 py-4">{formatNumber(row.electricalFailure, "%", 1)}</td>
                  <td className="px-3 py-4">{formatNumber(row.coolingFailure, "%", 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AIPageFrame>
  );
}

export function MaintenancePlannerPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = overview?.machines || [];
  const [activeMachineId, setActiveMachineId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (machineId: string) => {
    setActiveMachineId(machineId);
    setIsGenerating(true);

    try {
      await generateMaintenancePlan(machineId);
      await reload();
    } finally {
      setIsGenerating(false);
      setActiveMachineId(null);
    }
  };

  return (
    <AIPageFrame
      description="Prioritized plans with downtime, cost, technicians, spare parts, completion time, and calendar recommendations."
      eyebrow="Maintenance Planner"
      error={error}
      icon={CalendarClock}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="AI Maintenance Planner"
    >
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {machines.map((machine) => (
          <article
            key={machine.machine.machineId}
            className="rounded-lg border border-slate-800 bg-slate-900/75 p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xl font-bold text-white">{machine.machine.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {machine.machine.machineId} / {machine.rootCauseSummary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerate(machine.machine.machineId)}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-60"
              >
                {activeMachineId === machine.machine.machineId && isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wrench size={16} />
                )}
                Generate Plan
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Priority</p>
                <p className="mt-1 font-semibold text-white">
                  {machine.maintenancePlan.priority || "Monitor"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Downtime</p>
                <p className="mt-1 font-semibold text-white">
                  {formatNumber(machine.maintenancePlan.estimatedDowntimeHours, "h", 1)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Cost</p>
                <p className="mt-1 font-semibold text-white">
                  {formatNumber(machine.maintenancePlan.estimatedCost, "", 0)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Complete</p>
                <p className="mt-1 font-semibold text-white">
                  {formatDateTime(machine.maintenancePlan.estimatedCompletionTime)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-300">Technicians</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(machine.maintenancePlan.requiredTechnicians || []).map((technician) => (
                    <span
                      key={technician}
                      className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                    >
                      {technician}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Spare Parts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(machine.maintenancePlan.requiredSpareParts || []).map((part) => (
                    <span
                      key={part}
                      className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-100"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AIPageFrame>
  );
}

export function RootCauseExplorerPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = overview?.machines || [];

  return (
    <AIPageFrame
      description="Probable causes, evidence, explanations, and corrective actions from abnormal sensor signatures."
      eyebrow="Root Cause Explorer"
      error={error}
      icon={Search}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Root Cause Explorer"
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {machines.map((machine) => (
          <article
            key={machine.machine.machineId}
            className="rounded-lg border border-slate-800 bg-slate-900/75 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-white">{machine.machine.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {machine.machine.machineId} / {machine.anomaly.reason}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityBadgeClass[machine.anomaly.severity]}`}
              >
                {machine.anomaly.severity}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {machine.topRootCauses.slice(0, 3).map((cause) => (
                <div
                  key={cause.cause}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{cause.cause}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {cause.explanation}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-cyan-200">
                      {formatNumber(cause.probability, "%", 1)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Evidence
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        {cause.evidence.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Corrective Actions
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        {cause.correctiveActions.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AIPageFrame>
  );
}

export function FleetHealthPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();
  const machines = overview?.machines || [];

  return (
    <AIPageFrame
      description="Fleet-wide health, risk distribution, anomaly severity, and useful-life concentration."
      eyebrow="Fleet Health"
      error={error}
      icon={Factory}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Fleet Health"
    >
      {overview ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {(["Low", "Medium", "High", "Critical"] as AISeverity[]).map((severity) => (
              <article
                key={severity}
                className={`rounded-lg border p-5 ${severityBadgeClass[severity]}`}
              >
                <p className="text-sm font-semibold">{severity}</p>
                <p className="mt-3 text-3xl font-bold">
                  {overview.summary.riskDistribution[severity]}
                </p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RiskMatrixChart machines={machines} />
            <HealthTrendChart machines={machines} />
            <RulTrendChart machines={machines} />
            <AnomalyTimelineChart machines={machines} />
          </section>

          <MachineTable machines={machines} />
        </>
      ) : null}
    </AIPageFrame>
  );
}

export function ExecutiveInsightsPageContent() {
  const { overview, isLoading, isRefreshing, error, reload } = useAIOverviewData();

  return (
    <AIPageFrame
      description="Executive recommendations with confidence, risk context, maintenance impact, and fleet-level narrative."
      eyebrow="Executive Insights"
      error={error}
      icon={BarChart3}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={reload}
      title="Executive Insights"
    >
      {overview ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {overview.executiveInsights.map((insight) => (
              <article
                key={insight.title}
                className="rounded-lg border border-slate-800 bg-slate-900/75 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">
                      {insight.title}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-white">
                      {insight.value}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    {formatNumber(insight.confidence, "%", 1)}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  {insight.narrative}
                </p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <RecommendationList recommendations={overview.recommendations} />
            <section className="rounded-lg border border-slate-800 bg-slate-900/75 p-5">
              <h2 className="text-xl font-bold text-white">Decision Summary</h2>
              <div className="mt-5 space-y-4">
                <MetricCard
                  detail="AI health across monitored assets"
                  icon={HeartPulse}
                  label="Fleet Health"
                  tone="emerald"
                  value={formatNumber(overview.summary.averageHealth, "%", 1)}
                />
                <MetricCard
                  detail="Average decision risk"
                  icon={Gauge}
                  label="Fleet Risk"
                  tone="amber"
                  value={formatNumber(overview.summary.averageRisk, "%", 1)}
                />
                <MetricCard
                  detail="High-risk assets"
                  icon={AlertTriangle}
                  label="Escalations"
                  tone="red"
                  value={overview.summary.highRiskMachines}
                />
              </div>
            </section>
          </section>
        </>
      ) : null}
    </AIPageFrame>
  );
}
