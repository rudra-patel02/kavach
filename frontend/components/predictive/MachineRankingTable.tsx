"use client";

import { ArrowUpDown, Cpu } from "lucide-react";
import type { PredictiveRankingRow } from "@/types/predictive";
import { riskBadgeClass, riskTextClass } from "./predictiveStyles";

interface MachineRankingTableProps {
  rows: PredictiveRankingRow[];
}

export default function MachineRankingTable({ rows }: MachineRankingTableProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Machine Ranking</h2>
          <p className="mt-1 text-sm text-slate-400">
            Sorted by risk, failure probability, and RUL
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <ArrowUpDown size={22} />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Machine</th>
              <th className="px-3 py-3">Health</th>
              <th className="px-3 py-3">Failure</th>
              <th className="px-3 py-3">RUL</th>
              <th className="px-3 py-3">Confidence</th>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3">Priority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.machineId}
                className="border-b border-slate-800/70 transition-colors hover:bg-slate-800/35"
              >
                <td className="px-3 py-4 font-semibold text-cyan-300">
                  #{row.rank}
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-cyan-300">
                      <Cpu size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{row.name}</p>
                      <p className="text-xs text-slate-400">
                        {row.department} / {row.machineId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`px-3 py-4 font-semibold ${row.machineHealth < 60 ? "text-red-300" : "text-emerald-300"}`}>
                  {row.machineHealth}%
                </td>
                <td className="px-3 py-4 text-orange-200">
                  {row.failureProbability}%
                </td>
                <td className="px-3 py-4 text-slate-200">
                  {row.remainingUsefulLifeHours} hrs
                </td>
                <td className="px-3 py-4 text-cyan-200">
                  {row.aiConfidence}%
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass[row.riskLevel]}`}
                  >
                    {row.riskLevel}
                  </span>
                </td>
                <td className={`px-3 py-4 font-semibold ${riskTextClass[row.riskLevel]}`}>
                  {row.maintenancePriority}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
