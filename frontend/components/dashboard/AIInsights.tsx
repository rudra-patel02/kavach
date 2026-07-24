"use client";

import { useMemo } from "react";
import { BriefcaseBusiness, BrainCircuit, ShieldCheck, Wrench } from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

export default function AIInsights() {
  const machines = useMachineFeed();

  const insights = useMemo(() => {
    const nextInsights: {
      title: string;
      message: string;
      color: string;
      confidence: number;
      businessImpact: string;
      recommendedAction: string;
      priority: string;
    }[] = [];

    machines.forEach((machine) => {
    const confidence = Number(
      machine.aiConfidencePercent ||
        machine.aiIntelligence?.confidencePercent ||
        machine.aiPrediction?.confidencePercent ||
        72
    );
    const priority =
      machine.aiPrediction?.maintenancePriority ||
      (machine.status === "Critical"
        ? "Immediate"
        : machine.status === "Warning"
        ? "High"
        : machine.health < 70
        ? "Planned"
        : "Monitor");
    const action =
      machine.aiPrediction?.recommendedAction ||
      machine.aiPrediction?.recommendation ||
      "Inspect the machine, validate live telemetry, and continue preventive monitoring.";

    if (machine.temperature > 90) {
      nextInsights.push({
        title: `${machine.name} Temperature`,
        message: `Temperature reached ${machine.temperature.toFixed(
          1
        )} C. Immediate inspection recommended.`,
        color: "border-red-400/50",
        confidence,
        businessImpact:
          "Thermal stress can reduce output, increase scrap risk, and force an unplanned maintenance window.",
        recommendedAction: action,
        priority,
      });
    }

    if (machine.vibration > 0.7) {
      nextInsights.push({
        title: `${machine.name} Vibration`,
        message: `High vibration detected (${machine.vibration.toFixed(
          2
        )}). Check bearings and alignment.`,
        color: "border-yellow-400/50",
        confidence,
        businessImpact:
          "Vibration escalation can accelerate bearing wear and create secondary mechanical damage.",
        recommendedAction: action,
        priority,
      });
    }

    if (machine.health < 60) {
      nextInsights.push({
        title: `${machine.name} Health`,
        message: `Machine health is ${machine.health.toFixed(
          0
        )}%. Schedule preventive maintenance.`,
        color: "border-orange-400/50",
        confidence,
        businessImpact:
          "Low health increases downtime exposure and may affect production schedule reliability.",
        recommendedAction: action,
        priority,
      });
    }

    if (machine.power > 80) {
      nextInsights.push({
        title: `${machine.name} Energy`,
        message: `Power usage is unusually high (${machine.power.toFixed(
          0
        )} kW). Investigate load conditions.`,
        color: "border-blue-400/50",
        confidence,
        businessImpact:
          "High power draw increases operating cost and can indicate overload or mechanical drag.",
        recommendedAction: action,
        priority,
      });
    }
    });

    if (nextInsights.length === 0) {
      nextInsights.push({
      title: "Factory Status",
      message: "All monitored machines are operating within normal limits.",
      color: "border-emerald-400/50",
      confidence: 86,
      businessImpact:
        "No immediate production impact is visible from current telemetry.",
      recommendedAction: "Continue live monitoring and planned maintenance.",
      priority: "Monitor",
      });
    }

    return nextInsights;
  }, [machines]);

  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300/80">
        Recommendations
      </p>
      <h2 className="mb-6 mt-2 flex items-center gap-3 text-2xl font-black text-white">
        <BrainCircuit size={23} className="text-violet-300" />
        AI Insights
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className={`premium-tile surface-enter rounded-xl border-l-4 ${item.color} p-4`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <h3 className="font-bold text-white">{item.title}</h3>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {item.message}
            </p>

            <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-300">
                  <ShieldCheck size={15} className="text-violet-300" />
                  Confidence
                </div>
                <p className="text-white">{item.confidence}%</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-300">
                  <Wrench size={15} className="text-violet-300" />
                  Priority
                </div>
                <p className="text-white">{item.priority}</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 lg:col-span-2">
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-300">
                  <BriefcaseBusiness size={15} className="text-violet-300" />
                  Business impact
                </div>
                <p className="leading-6 text-slate-300">{item.businessImpact}</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 lg:col-span-2">
                <div className="mb-1 flex items-center gap-2 font-semibold text-slate-300">
                  <Wrench size={15} className="text-violet-300" />
                  Recommended action
                </div>
                <p className="leading-6 text-slate-300">{item.recommendedAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
