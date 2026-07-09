"use client";

import { BrainCircuit, ShieldAlert } from "lucide-react";
import {
  buildStyles,
  CircularProgressbarWithChildren,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import type { PredictiveOverview } from "@/types/predictive";
import { riskBadgeClass, riskChartColor } from "./predictiveStyles";

interface AIRiskGaugeProps {
  overview: PredictiveOverview;
}

export default function AIRiskGauge({ overview }: AIRiskGaugeProps) {
  const riskLevel = overview.summary.riskLevel;
  const probability = overview.summary.failureProbability;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Risk Gauge</h2>
          <p className="mt-1 text-sm text-slate-400">
            Plant-level failure probability
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <BrainCircuit size={22} />
        </span>
      </div>

      <div className="mx-auto h-64 w-64">
        <CircularProgressbarWithChildren
          value={probability}
          strokeWidth={9}
          styles={buildStyles({
            pathColor: riskChartColor[riskLevel],
            trailColor: "#1e293b",
          })}
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{probability}%</p>
            <p className="mt-1 text-sm text-slate-400">Failure probability</p>
            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass[riskLevel]}`}
            >
              {riskLevel} risk
            </span>
          </div>
        </CircularProgressbarWithChildren>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">AI Confidence</p>
          <p className="mt-2 text-2xl font-bold text-cyan-300">
            {overview.summary.aiConfidence}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Priority</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
            <ShieldAlert size={22} className="text-orange-300" />
            {overview.summary.maintenancePriority}
          </p>
        </div>
      </div>
    </section>
  );
}
