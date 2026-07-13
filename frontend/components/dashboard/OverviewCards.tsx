"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Thermometer,
  Zap,
} from "lucide-react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

export default function OverviewCards() {
  const [machines, setMachines] = useState<MachineData[]>([]);

  useEffect(() => {
    fetchMachines()
      .then((data) => setMachines(data))
      .catch(() => setMachines([]));

    const handleMachineUpdate = (data: MachineData[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  const totalMachines = machines.length;

  const avgHealth =
    machines.length > 0
      ? (
          machines.reduce((sum, machine) => sum + (machine.health || 0), 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const avgTemperature =
    machines.length > 0
      ? (
          machines.reduce(
            (sum, machine) => sum + (machine.temperature || 0),
            0
          ) / machines.length
        ).toFixed(1)
      : "0";

  const criticalAlerts = machines.filter(
    (machine) => machine.status === "Critical"
  ).length;

  const energy =
    machines.length > 0
      ? machines.reduce((sum, machine) => sum + (machine.power || 0), 0).toFixed(0)
      : "0";

  const cards = [
    {
      color: "text-cyan-400",
      icon: Cpu,
      title: "Machines",
      value: totalMachines,
    },
    {
      color: "text-green-400",
      icon: Activity,
      title: "Plant Health",
      value: `${avgHealth}%`,
    },
    {
      color: "text-red-400",
      icon: AlertTriangle,
      title: "Critical Alerts",
      value: criticalAlerts,
    },
    {
      color: "text-yellow-400",
      icon: Zap,
      title: "Energy",
      value: `${energy} kW`,
    },
    {
      color: "text-orange-400",
      icon: Thermometer,
      title: "Avg Temp",
      value: `${avgTemperature} C`,
    },
    {
      color: "text-purple-400",
      icon: Brain,
      title: "AI Confidence",
      value: "96%",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">{card.title}</p>

                <h2 className={`mt-3 text-4xl font-bold ${card.color}`}>
                  {card.value}
                </h2>
              </div>

              <Icon size={42} className={`${card.color} shrink-0`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
