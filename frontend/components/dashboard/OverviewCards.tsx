"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      accent: "from-cyan-300 to-blue-400",
      color: "text-cyan-300",
      icon: Cpu,
      title: "Machines",
      value: totalMachines,
    },
    {
      accent: "from-emerald-300 to-green-500",
      color: "text-emerald-300",
      icon: Activity,
      title: "Plant Health",
      value: `${avgHealth}%`,
    },
    {
      accent: "from-red-300 to-rose-500",
      color: "text-rose-300",
      icon: AlertTriangle,
      title: "Critical Alerts",
      value: criticalAlerts,
    },
    {
      accent: "from-amber-200 to-yellow-500",
      color: "text-amber-300",
      icon: Zap,
      title: "Energy",
      value: `${energy} kW`,
    },
    {
      accent: "from-orange-300 to-red-400",
      color: "text-orange-300",
      icon: Thermometer,
      title: "Avg Temp",
      value: `${avgTemperature} C`,
    },
    {
      accent: "from-violet-300 to-fuchsia-500",
      color: "text-violet-300",
      icon: Brain,
      title: "AI Confidence",
      value: "96%",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.42 }}
            whileHover={{ y: -4 }}
            className="premium-card surface-enter rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {card.title}
                </p>

                <h2 className={`mt-4 text-4xl font-black tracking-tight ${card.color}`}>
                  {card.value}
                </h2>
              </div>

              <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 shadow-lg shadow-slate-950/30`}>
                <Icon size={26} className="shrink-0 text-slate-950" />
              </div>
            </div>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className={`pulse-line h-full w-2/3 rounded-full bg-gradient-to-r ${card.accent}`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
