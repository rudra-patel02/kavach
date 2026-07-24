"use client";

import { BriefcaseBusiness, BrainCircuit, Gauge, ShieldCheck, Wrench } from "lucide-react";
import type { PredictiveRecommendation } from "@/types/predictive";
import { riskBadgeClass, riskBorderClass } from "./predictiveStyles";

interface AIRecommendationCardsProps {
  recommendations: PredictiveRecommendation[];
}

export default function AIRecommendationCards({
  recommendations,
}: AIRecommendationCardsProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            AI Recommendation Cards
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Rule-based maintenance guidance
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <BrainCircuit size={22} />
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {recommendations.map((item) => (
          <article
            key={item.machineId}
            className={`rounded-xl border bg-slate-950/75 p-5 ${riskBorderClass[item.riskLevel]}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {item.name} / confidence {item.confidence}%
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass[item.riskLevel]}`}
              >
                {item.riskLevel}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Gauge size={16} className="text-cyan-300" />
                    Confidence
                  </div>
                  <p className="text-2xl font-black text-white">
                    {item.confidence}%
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Wrench size={16} className="text-cyan-300" />
                    Priority
                  </div>
                  <p className="text-2xl font-black text-white">
                    {item.maintenancePriority || item.priority}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <ShieldCheck size={16} className="text-cyan-300" />
                  Probable root cause
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  {item.probableCause}
                </p>
              </div>

              {item.businessImpact ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <BriefcaseBusiness size={16} className="text-cyan-300" />
                    Business impact
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {item.businessImpact}
                  </p>
                </div>
              ) : null}

              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Wrench size={16} className="text-cyan-300" />
                  Recommended action
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  {item.recommendation}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
