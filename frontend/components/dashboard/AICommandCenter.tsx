"use client";

import { useMemo, useState } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { useMachineFeed } from "@/hooks/useMachineFeed";
import LiveBadge from "./LiveBadge";

type DecisionState = "approved" | "rejected";

export default function AICommandCenter() {
  const machines = useMachineFeed();
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});

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

  const recommendedActions = useMemo(
    () =>
      machines
        .filter(
          (machine) =>
            machine.status === "Critical" ||
            machine.status === "Warning" ||
            machine.health < 65 ||
            machine.temperature > 85 ||
            machine.vibration > 0.7
        )
        .slice(0, 5)
        .map((machine) => {
          const risk =
            machine.status === "Critical" || machine.health < 45
              ? "Critical"
              : machine.temperature > 90 || machine.vibration > 0.9
                ? "High"
                : "Medium";
          const action =
            risk === "Critical"
              ? "Approve controlled maintenance window and reduce operating load."
              : risk === "High"
                ? "Schedule priority inspection and verify cooling, vibration, and power draw."
                : "Continue monitoring and add this asset to the next shift handover.";

          return {
            id: machine.machineId,
            action,
            machine: machine.name,
            metrics: `${Math.round(machine.health)}% health / ${machine.temperature.toFixed(1)} C`,
            risk,
          };
        }),
    [machines]
  );

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

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/80">
              Human Approval Required
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-black text-white">
              <ShieldCheck size={20} className="text-cyan-300" />
              Autonomous AI Control Center
            </h3>
          </div>
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
            No auto-execution
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {recommendedActions.length > 0 ? (
            recommendedActions.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-white">{item.machine}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                          item.risk === "Critical"
                            ? "border-red-400/30 bg-red-500/10 text-red-100"
                            : item.risk === "High"
                              ? "border-orange-400/30 bg-orange-500/10 text-orange-100"
                              : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
                        }`}
                      >
                        {item.risk}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.metrics}</p>
                    <p className="mt-3 text-sm leading-5 text-slate-200">
                      {item.action}
                    </p>
                  </div>

                  {decisions[item.id] ? (
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                        decisions[item.id] === "approved"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                          : "border-red-400/30 bg-red-500/10 text-red-100"
                      }`}
                    >
                      {decisions[item.id] === "approved" ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <XCircle size={15} />
                      )}
                      {decisions[item.id]}
                    </span>
                  ) : (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((current) => ({
                            ...current,
                            [item.id]: "approved",
                          }))
                        }
                        className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecisions((current) => ({
                            ...current,
                            [item.id]: "rejected",
                          }))
                        }
                        className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100 transition-colors hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 lg:col-span-2">
              No critical AI actions are pending supervisor review.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
