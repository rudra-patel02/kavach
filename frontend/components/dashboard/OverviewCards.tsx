"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";
import {
  Cpu,
  Activity,
  AlertTriangle,
  Brain,
  Zap,
  Thermometer,
} from "lucide-react";

export default function OverviewCards() {
  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/machines")
      .then((res) => res.json())
      .then((data) => setMachines(data))
      .catch(console.error);

    socket.on("machineUpdate", (data: any[]) => {
      setMachines(data);
    });

    return () => {
      socket.off("machineUpdate");
    };
  }, []);

  const totalMachines = machines.length;

  const avgHealth =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + (m.health || 0), 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const avgTemperature =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + (m.temperature || 0), 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const criticalAlerts = machines.filter(
    (m) => m.status === "Critical"
  ).length;

  const energy =
    machines.length > 0
      ? machines
          .reduce((sum, m) => sum + (m.power || 0), 0)
          .toFixed(0)
      : "0";

  const cards = [
    {
      title: "Machines",
      value: totalMachines,
      icon: Cpu,
      color: "text-cyan-400",
    },
    {
      title: "Plant Health",
      value: `${avgHealth}%`,
      icon: Activity,
      color: "text-green-400",
    },
    {
      title: "Critical Alerts",
      value: criticalAlerts,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Energy",
      value: `${energy} kW`,
      icon: Zap,
      color: "text-yellow-400",
    },
    {
      title: "Avg Temp",
      value: `${avgTemperature}°C`,
      icon: Thermometer,
      color: "text-orange-400",
    },
    {
      title: "AI Confidence",
      value: "96%",
      icon: Brain,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-cyan-500 transition-all duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">{card.title}</p>

                <h2 className={`text-4xl font-bold mt-3 ${card.color}`}>
                  {card.value}
                </h2>
              </div>

              <Icon size={42} className={card.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}