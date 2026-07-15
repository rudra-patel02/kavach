"use client";

import { motion } from "framer-motion";
import { Box, Factory, Layers3, Radar, Sparkles, Zap } from "lucide-react";
import FactoryScene from "@/components/3d/FactoryScene";

export default function DigitalTwin() {
  const twinMetrics = [
    { icon: Radar, label: "Telemetry", value: "Live", tone: "text-emerald-300" },
    { icon: Layers3, label: "Model", value: "3D", tone: "text-cyan-300" },
    { icon: Zap, label: "Signals", value: "AI", tone: "text-amber-300" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48 }}
      className="premium-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles size={14} />
            Spatial Operations
          </div>
          <h2 className="mt-3 flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">
            <span className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-3 shadow-lg shadow-cyan-950/30">
              <Factory size={24} className="text-cyan-300" />
            </span>
            Digital Twin
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Real-time industrial plant visualization with machine state, AI risk context, and spatial telemetry.
          </p>
        </div>

        <div className="premium-tile rounded-xl px-3 py-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Box size={16} className="text-cyan-300" />
            3D plant view
          </span>
        </div>
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[1fr_17rem]">
        <div className="relative h-[460px] min-h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-400/15 bg-slate-950/70 shadow-2xl shadow-black/30 sm:h-[540px]">
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-cyan-400/20 bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-xl">
            Interactive plant layer
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 grid gap-3 sm:grid-cols-3">
            {twinMetrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.36 }}
                  className="rounded-xl border border-white/10 bg-slate-950/72 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Icon size={15} className={metric.tone} />
                    {metric.label}
                  </div>
                  <div className={`mt-1 text-lg font-black ${metric.tone}`}>
                    {metric.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/5" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.28),transparent_38%,rgba(8,145,178,0.08))]" />
          <div className="relative h-full">
            <FactoryScene />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {[
            ["Scene Depth", "Dynamic lighting and orbital inspection"],
            ["Asset Focus", "Hover machines for health and AI context"],
            ["Operations View", "Status color, risk, and telemetry overlays"],
          ].map(([title, copy], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.36 }}
              className="premium-tile rounded-2xl p-4"
            >
              <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 shadow-lg shadow-cyan-300/20" />
              <h3 className="font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
