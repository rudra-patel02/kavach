"use client";

import { Wrench } from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

type Machine = {
  name: string;
  health: number;
  status: string;
};

export default function MaintenanceTimeline() {
  const machines = useMachineFeed() as Machine[];

  const schedule = machines
    .filter((machine) => machine.health < 90)
    .sort((a, b) => a.health - b.health);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
        <Wrench size={24} className="text-cyan-300" />
        Maintenance Timeline
      </h2>

      <div className="space-y-4">
        {schedule.length === 0 ? (
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
            No maintenance currently required.
          </p>
        ) : (
          schedule.map((machine) => (
            <div
              key={machine.name}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-white">{machine.name}</h3>

                <span className="font-semibold text-cyan-400">
                  {machine.health.toFixed(0)}%
                </span>
              </div>

              <p className="mt-2 text-slate-300">
                {machine.health < 50
                  ? "Immediate inspection required."
                  : machine.health < 70
                    ? "Maintenance recommended within 3 days."
                    : "Routine maintenance recommended within 7 days."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
