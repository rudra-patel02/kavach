"use client";

import { useMemo } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { AlertTriangle, Bot, TrendingUp, Zap } from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";
import LiveBadge from "./LiveBadge";

export default function AICommandCenter() {
  const machines = useMachineFeed();

  const avgHealth =
    machines.length > 0
      ? Math.round(
          machines.reduce((sum, machine) => sum + (machine.health || 0), 0) /
            machines.length
        )
      : 0;

  const avgEfficiency =
    machines.length > 0
      ? Math.round(
          machines.reduce((sum, machine) => sum + (machine.efficiency || 0), 0) /
            machines.length
        )
      : 0;

  const failureRisk =
    machines.length > 0
      ? Math.round(
          (machines.filter((machine) => machine.status === "Critical").length /
            machines.length) *
            100
        )
      : 0;

  const cards = useMemo(() => [
    {
      border: "border-green-500/30",
      color: "text-green-400",
      icon: Bot,
      title: "AI Health Score",
      value: avgHealth,
      unit: "%",
    },
    {
      border: "border-blue-500/30",
      color: "text-blue-400",
      icon: Zap,
      title: "Energy Efficiency",
      value: avgEfficiency,
      unit: "%",
    },
    {
      border: "border-yellow-500/30",
      color: "text-yellow-400",
      icon: AlertTriangle,
      title: "Failure Risk",
      value: failureRisk,
      unit: "%",
    },
    {
      border: "border-purple-500/30",
      color: "text-purple-400",
      icon: TrendingUp,
      title: "Productivity",
      value: avgEfficiency,
      unit: "%",
    },
  ], [avgEfficiency, avgHealth, failureRisk]);

  return (
    <section className="premium-card rounded-2xl p-6 lg:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Autonomous Intelligence
          </p>
          <h2 className="mt-2 flex items-center gap-3 text-2xl font-black text-white md:text-3xl">
            <Bot className="text-cyan-300" size={28} />
            AI Command Center
          </h2>
        </div>

        <LiveBadge />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.42 }}
              whileHover={{ y: -4 }}
              className={`premium-tile metric-card surface-enter rounded-2xl p-5 transition-all duration-300 hover:bg-slate-900/80 ${card.border}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-3 shadow-inner shadow-white/5">
                  <Icon size={24} className={card.color} />
                </div>

                <span className={`text-4xl font-black ${card.color}`}>
                  <CountUp end={card.value} duration={1.5} suffix={card.unit} />
                </span>
              </div>

              <h3 className="mt-5 text-base font-bold text-white">
                {card.title}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Live Industrial AI Metric
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
