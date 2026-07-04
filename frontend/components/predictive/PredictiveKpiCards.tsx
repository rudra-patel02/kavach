"use client";

import {
  Activity,
  Brain,
  Gauge,
  Timer,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PredictiveKpi, PredictiveOverview } from "@/types/predictive";
import { riskBadgeClass, riskTextClass } from "./predictiveStyles";

interface PredictiveKpiCardsProps {
  overview: PredictiveOverview;
}

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "Machine Health": Activity,
  "Failure Probability": TrendingUp,
  "Remaining Useful Life": Timer,
  "AI Confidence": Brain,
};

function KpiCard({ item }: { item: PredictiveKpi }) {
  const Icon = iconMap[item.label] || Gauge;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className={`mt-3 text-3xl font-bold ${riskTextClass[item.riskLevel]}`}>
            {item.value}
            <span className="ml-1 text-lg text-slate-400">{item.unit}</span>
          </p>
        </div>

        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Icon size={24} />
        </span>
      </div>

      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass[item.riskLevel]}`}
      >
        {item.riskLevel} signal
      </span>
    </article>
  );
}

export default function PredictiveKpiCards({ overview }: PredictiveKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {overview.kpis.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}

      <article className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 md:col-span-2 xl:col-span-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Wrench size={18} />
              Maintenance Priority
            </div>
            <p className="text-2xl font-bold text-white">
              {overview.summary.maintenancePriority}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {overview.summary.highRiskMachines} high-risk machines from{" "}
              {overview.summary.totalMachines} monitored assets
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(overview.summary.riskDistribution).map(([risk, count]) => (
              <div
                key={risk}
                className={`rounded-xl border px-4 py-3 ${riskBadgeClass[risk as keyof typeof riskBadgeClass]}`}
              >
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
