"use client";

import {
  Activity,
  BatteryCharging,
  Gauge,
  HeartPulse,
  Thermometer,
  X,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const metrics = [
  { icon: Activity, label: "Status", value: "Running", color: "text-emerald-300" },
  { icon: Thermometer, label: "Temperature", value: "54 C", color: "text-orange-300" },
  { icon: Gauge, label: "RPM", value: "1450", color: "text-cyan-300" },
  { icon: HeartPulse, label: "Health", value: "98%", color: "text-emerald-300" },
  { icon: BatteryCharging, label: "Power", value: "22 kW", color: "text-violet-300" },
];

export default function MachineInfoPanel({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <aside className="absolute right-4 top-4 z-[100] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-slate-700 bg-slate-950/95 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur sm:right-8 sm:top-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Machine-01</h2>
          <p className="mt-1 text-sm text-slate-400">Live machine snapshot</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close machine info"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
            >
              <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                <Icon size={15} className={metric.color} />
                {metric.label}
              </span>
              <span className={`text-sm font-semibold ${metric.color}`}>
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
          AI Prediction
        </p>
        <p className="mt-2 text-lg font-bold text-white">Bearing Healthy</p>
        <p className="mt-1 text-sm text-cyan-100/80">
          Next maintenance in 14 days.
        </p>
      </div>
    </aside>
  );
}
