"use client";

import { Timer, Wrench } from "lucide-react";
import type { PredictiveMachine } from "@/types/predictive";
import { riskBadgeClass, riskBorderClass, riskTextClass } from "./predictiveStyles";

interface RemainingUsefulLifeCardsProps {
  machines: PredictiveMachine[];
}

export default function RemainingUsefulLifeCards({
  machines,
}: RemainingUsefulLifeCardsProps) {
  const criticalMachines = machines.slice(0, 4);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Remaining Useful Life
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Shortest projected maintenance windows
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Timer size={22} />
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {criticalMachines.map((machine) => (
          <article
            key={machine.machineId}
            className={`rounded-xl border bg-slate-950/75 p-4 transition-all duration-300 hover:-translate-y-0.5 ${riskBorderClass[machine.riskLevel]}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{machine.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {machine.department} / {machine.machineId}
                </p>
              </div>

              <span
                className={`rounded-full border px-2 py-1 text-xs font-semibold ${riskBadgeClass[machine.riskLevel]}`}
              >
                {machine.riskLevel}
              </span>
            </div>

            <p className={`text-3xl font-bold ${riskTextClass[machine.riskLevel]}`}>
              {machine.remainingUsefulLifeHours}
              <span className="ml-1 text-base text-slate-400">hrs</span>
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{
                  width: `${Math.max(
                    8,
                    Math.min(100, (machine.remainingUsefulLifeHours / 720) * 100)
                  )}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <Wrench size={16} className="text-cyan-300" />
              {machine.maintenancePriority} priority
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
