"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";

export default function ProductionAnalytics() {
  const machines = useMachineFeed();

  const running = machines.filter((m) => m.status === "Running").length;
  const warning = machines.filter((m) => m.status === "Warning").length;
  const critical = machines.filter((m) => m.status === "Critical").length;

  const avgHealth =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + m.health, 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const avgTemp =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + m.temperature, 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const metrics = useMemo(() => [
    ["Running", running, "text-emerald-300"],
    ["Warning", warning, "text-yellow-300"],
    ["Critical", critical, "text-red-300"],
    ["Avg Health", `${avgHealth}%`, "text-cyan-300"],
    ["Avg Temp", `${avgTemp} C`, "text-orange-300"],
  ], [avgHealth, avgTemp, critical, running, warning]);

  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
        Production
      </p>
      <h2 className="mb-6 mt-2 flex items-center gap-3 text-2xl font-black text-white">
        <BarChart3 size={22} className="text-cyan-300" />
        Production Analytics
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {metrics.map(([label, value, color], index) => (
          <div
            key={label}
            className="premium-tile surface-enter rounded-xl p-4 text-center"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <h3 className={`mt-3 text-3xl font-black ${color}`}>{value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
