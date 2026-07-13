"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { AlertTriangle, Bot, TrendingUp, Zap } from "lucide-react";
import { fetchMachines } from "@/lib/machines";
import LiveBadge from "./LiveBadge";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

export default function AICommandCenter() {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines()
      .then((data) => {
        setMachines(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load AI metrics"
        );
      });

    const handleMachineUpdate = (data: MachineData[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

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

  const cards = [
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
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-3 text-3xl font-bold text-white">
          <Bot className="text-cyan-300" size={28} />
          AI Command Center
        </h2>

        <LiveBadge />
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-xl border bg-slate-900 p-6 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/20 ${card.border}`}
            >
              <div className="flex items-center justify-between gap-4">
                <Icon size={34} className={card.color} />

                <span className={`text-4xl font-bold ${card.color}`}>
                  <CountUp end={card.value} duration={1.5} suffix={card.unit} />
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-white">
                {card.title}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Live Industrial AI Metric
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
