"use client";

import { HeartPulse, Thermometer, TrendingUp, Zap } from "lucide-react";
import type { ComponentType } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PredictiveOverview, PredictiveTrendPoint } from "@/types/predictive";

interface ChartDefinition {
  title: string;
  subtitle: string;
  data: PredictiveTrendPoint[];
  color: string;
  unit: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  variant: "area" | "line";
}

function TrendChart({ chart }: { chart: ChartDefinition }) {
  const Icon = chart.icon;
  const gradientId = `gradient-${chart.title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{chart.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{chart.subtitle}</p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-cyan-300">
          <Icon size={20} />
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer>
          {chart.variant === "area" ? (
            <AreaChart data={chart.data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.color} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={chart.color} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} unit={chart.unit} />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chart.color}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={chart.data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} unit={chart.unit} />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chart.color}
                strokeWidth={3}
                dot={{ r: 4, fill: chart.color }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function PredictiveTrendCharts({
  overview,
}: {
  overview: PredictiveOverview;
}) {
  const charts: ChartDefinition[] = [
    {
      title: "Temperature Trend",
      subtitle: "Estimated thermal movement",
      data: overview.trends.temperature,
      color: "#fb923c",
      unit: " C",
      icon: Thermometer,
      variant: "area",
    },
    {
      title: "Health Trend",
      subtitle: "Machine health trajectory",
      data: overview.trends.health,
      color: "#34d399",
      unit: "%",
      icon: HeartPulse,
      variant: "line",
    },
    {
      title: "Failure Probability Trend",
      subtitle: "Rule-based risk progression",
      data: overview.trends.failureProbability,
      color: "#f87171",
      unit: "%",
      icon: TrendingUp,
      variant: "area",
    },
    {
      title: "Energy Trend",
      subtitle: "Energy intensity movement",
      data: overview.trends.energy,
      color: "#38bdf8",
      unit: " kWh",
      icon: Zap,
      variant: "line",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {charts.map((chart) => (
        <TrendChart key={chart.title} chart={chart} />
      ))}

    </div>
  );
}
