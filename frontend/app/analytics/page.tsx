"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BatteryCharging,
  Clock,
  Download,
  Factory,
  Gauge,
  HeartPulse,
  Loader2,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  buildAnalyticsSeries,
  type AnalyticsPoint,
} from "@/lib/enterpriseAnalytics";
import { apiUrl } from "@/lib/api";
import { useEnterpriseTelemetry } from "@/hooks/useEnterpriseTelemetry";

const kpiToneClasses = {
  amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  blue: "border-blue-400/20 bg-blue-500/10 text-blue-200",
  cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  red: "border-red-400/20 bg-red-500/10 text-red-200",
  violet: "border-violet-400/20 bg-violet-500/10 text-violet-200",
};

const heatmapStatusClasses = {
  Critical: "border-red-400/40 bg-red-500/20 text-red-100",
  Offline: "border-slate-500/40 bg-slate-700/50 text-slate-200",
  Running: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  Warning: "border-amber-400/40 bg-amber-500/20 text-amber-100",
  Idle: "border-slate-500/40 bg-slate-700/50 text-slate-200",
  Maintenance: "border-orange-400/40 bg-orange-500/20 text-orange-100",
};

const formatNumber = (value: number, unit = "") =>
  `${Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "0"}${unit}`;

function ChartPanel({
  title,
  dataKey,
  color,
  data,
  type = "line",
}: {
  title: string;
  dataKey: keyof AnalyticsPoint;
  color: string;
  data: AnalyticsPoint[];
  type?: "area" | "bar" | "line";
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-300">
        {title}
      </h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : type === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Area
                dataKey={dataKey}
                fill={color}
                fillOpacity={0.22}
                stroke={color}
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Line
                dataKey={dataKey}
                dot={false}
                stroke={color}
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    machines,
    overview,
    workOrders,
    profiles,
    kpis,
    insights,
    isLoading,
    error,
  } = useEnterpriseTelemetry();
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const analyticsSeries = useMemo(
    () => buildAnalyticsSeries(machines, overview, workOrders),
    [machines, overview, workOrders]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveInsightIndex((currentIndex) =>
        insights.length ? (currentIndex + 1) % insights.length : 0
      );
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, [insights.length]);

  const exportCsv = async () => {
    setIsExporting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/analytics/export.csv"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `kavach-analytics-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setIsExporting(false);
    }
  };

  const kpiCards = [
    { label: "Total Machines", value: kpis.totalMachines, icon: Factory, tone: "cyan" },
    { label: "Running", value: kpis.running, icon: Activity, tone: "emerald" },
    { label: "Warning", value: kpis.warning, icon: AlertTriangle, tone: "amber" },
    { label: "Critical", value: kpis.critical, icon: AlertTriangle, tone: "red" },
    { label: "Average Health", value: formatNumber(kpis.averageHealth, "%"), icon: HeartPulse, tone: "emerald" },
    { label: "Overall OEE", value: formatNumber(kpis.overallOee, "%"), icon: Gauge, tone: "blue" },
    { label: "Today's Production", value: kpis.todaysProduction.toLocaleString(), icon: TrendingUp, tone: "cyan" },
    { label: "Downtime Today", value: formatNumber(kpis.downtimeToday, " hrs"), icon: Clock, tone: "amber" },
    { label: "Total Energy", value: formatNumber(kpis.totalEnergy, " kWh"), icon: Zap, tone: "violet" },
    { label: "Active Work Orders", value: kpis.activeWorkOrders, icon: Wrench, tone: "blue" },
    { label: "Critical Alerts", value: kpis.criticalAlerts, icon: AlertTriangle, tone: "red" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <BarChart3 size={18} />
              Executive Analytics
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Industrial Performance Command Center
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Live operational KPIs, predictive trends, asset heatmap, and AI
              insights for executive monitoring.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
            Socket.IO live analytics
          </div>

          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export CSV
          </button>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          {kpiCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/75 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-400">
                    {item.label}
                  </p>
                  <div
                    className={`rounded-lg border p-2 ${kpiToneClasses[item.tone]}`}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-white">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartPanel
            title="Machine Health Trend"
            data={analyticsSeries}
            dataKey="health"
            color="#22c55e"
            type="area"
          />
          <ChartPanel
            title="Energy Consumption"
            data={analyticsSeries}
            dataKey="energy"
            color="#a78bfa"
            type="bar"
          />
          <ChartPanel
            title="Temperature Trend"
            data={analyticsSeries}
            dataKey="temperature"
            color="#f97316"
          />
          <ChartPanel
            title="Failure Probability Trend"
            data={analyticsSeries}
            dataKey="failureProbability"
            color="#ef4444"
            type="area"
          />
          <ChartPanel
            title="Downtime Trend"
            data={analyticsSeries}
            dataKey="downtime"
            color="#f59e0b"
            type="bar"
          />
          <ChartPanel
            title="OEE Trend"
            data={analyticsSeries}
            dataKey="oee"
            color="#38bdf8"
          />
          <ChartPanel
            title="Maintenance Cost Trend"
            data={analyticsSeries}
            dataKey="maintenanceCost"
            color="#fb7185"
            type="area"
          />
          <ChartPanel
            title="Production Trend"
            data={analyticsSeries}
            dataKey="production"
            color="#2dd4bf"
            type="bar"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white">
                Industrial Plant Heatmap
              </h2>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-300">Green healthy</span>
                <span className="text-amber-300">Yellow warning</span>
                <span className="text-red-300">Red critical</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <div
                  key={profile.machine.machineId}
                  title={`${profile.machine.name}: ${profile.machine.health}% health, ${profile.failureProbability}% failure probability`}
                  className={`rounded-xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${heatmapStatusClasses[profile.machine.status]}`}
                >
                  <div className="font-bold">{profile.machine.name}</div>
                  <div className="mt-1 text-sm opacity-80">
                    {profile.machine.machineId} - {profile.machine.department}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span>Health {formatNumber(profile.machine.health, "%")}</span>
                    <span>Risk {profile.riskScore.toFixed(1)}</span>
                    <span>Temp {formatNumber(profile.machine.temperature, " C")}</span>
                    <span>RUL {profile.remainingUsefulLifeHours || "--"}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <BatteryCharging size={20} className="text-cyan-300" />
              Live AI Insights
            </h2>

            <div className="mt-5 min-h-40 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-5">
              <p className="text-lg font-semibold leading-relaxed text-cyan-50">
                {insights[activeInsightIndex] || "Loading AI insights..."}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {insights.slice(0, 5).map((insight, index) => (
                <div
                  key={insight}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    index === activeInsightIndex
                      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                      : "border-slate-800 bg-slate-950/60 text-slate-400"
                  }`}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
