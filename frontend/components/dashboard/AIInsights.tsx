"use client";

import { useMemo } from "react";
import { BrainCircuit } from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

export default function AIInsights() {
  const machines = useMachineFeed();

  const insights = useMemo(() => {
    const nextInsights: {
    title: string;
    message: string;
    color: string;
    }[] = [];

    machines.forEach((machine) => {
    if (machine.temperature > 90) {
      nextInsights.push({
        title: `${machine.name} Temperature`,
        message: `Temperature reached ${machine.temperature.toFixed(
          1
        )} C. Immediate inspection recommended.`,
        color: "border-red-400/50",
      });
    }

    if (machine.vibration > 0.7) {
      nextInsights.push({
        title: `${machine.name} Vibration`,
        message: `High vibration detected (${machine.vibration.toFixed(
          2
        )}). Check bearings and alignment.`,
        color: "border-yellow-400/50",
      });
    }

    if (machine.health < 60) {
      nextInsights.push({
        title: `${machine.name} Health`,
        message: `Machine health is ${machine.health.toFixed(
          0
        )}%. Schedule preventive maintenance.`,
        color: "border-orange-400/50",
      });
    }

    if (machine.power > 80) {
      nextInsights.push({
        title: `${machine.name} Energy`,
        message: `Power usage is unusually high (${machine.power.toFixed(
          0
        )} kW). Investigate load conditions.`,
        color: "border-blue-400/50",
      });
    }
    });

    if (nextInsights.length === 0) {
      nextInsights.push({
      title: "Factory Status",
      message: "All monitored machines are operating within normal limits.",
      color: "border-emerald-400/50",
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
          </div>
        ))}
      </div>
    </div>
  );
}
