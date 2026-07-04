"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { fetchMachines } from "@/lib/machines";
import LiveBadge from "./LiveBadge";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

export default function AICommandCenter() {
  const [machines, setMachines] = useState<MachineData[]>([]);

  useEffect(() => {
    fetchMachines()
      .then((data) => setMachines(data))
      .catch(console.error);

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
          machines.reduce((sum, m) => sum + (m.health || 0), 0) /
            machines.length
        )
      : 0;

  const avgEfficiency =
    machines.length > 0
      ? Math.round(
          machines.reduce((sum, m) => sum + (m.efficiency || 0), 0) /
            machines.length
        )
      : 0;

  const failureRisk =
    machines.length > 0
      ? Math.round(
          (machines.filter((m) => m.status === "Critical").length /
            machines.length) *
            100
        )
      : 0;

  const productivity =
    machines.length > 0
      ? Math.round(
          machines.reduce((sum, m) => sum + (m.efficiency || 0), 0) /
            machines.length
        )
      : 0;

  const cards = [
    {
      title: "AI Health Score",
      value: avgHealth,
      unit: "%",
      color: "text-green-400",
      border: "border-green-500/30",
      icon: "🤖",
    },
    {
      title: "Energy Efficiency",
      value: avgEfficiency,
      unit: "%",
      color: "text-blue-400",
      border: "border-blue-500/30",
      icon: "⚡",
    },
    {
      title: "Failure Risk",
      value: failureRisk,
      unit: "%",
      color: "text-yellow-400",
      border: "border-yellow-500/30",
      icon: "⚠️",
    },
    {
      title: "Productivity",
      value: productivity,
      unit: "%",
      color: "text-purple-400",
      border: "border-purple-500/30",
      icon: "📈",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">
          🤖 AI Command Center
        </h2>

        <LiveBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl bg-slate-900 border ${card.border} p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20`}
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl">{card.icon}</span>

              <span className={`text-4xl font-bold ${card.color}`}>
                <CountUp
                  end={card.value}
                  duration={1.5}
                  suffix={card.unit}
                />
              </span>
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {card.title}
            </h3>

            <p className="text-slate-400 text-sm mt-1">
              Live Industrial AI Metric
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
