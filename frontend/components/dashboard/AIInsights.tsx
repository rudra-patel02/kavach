"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";

export default function AIInsights() {
  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/machines")
      .then((res) => res.json())
      .then((data) => setMachines(data));

    socket.on("machineUpdate", (data: any[]) => {
      setMachines(data);
    });

    return () => {
      socket.off("machineUpdate");
    };
  }, []);

  const insights: {
    title: string;
    message: string;
    color: string;
  }[] = [];

  machines.forEach((machine) => {
    if (machine.temperature > 90) {
      insights.push({
        title: `${machine.name} Temperature`,
        message: `Temperature reached ${machine.temperature.toFixed(
          1
        )}°C. Immediate inspection recommended.`,
        color: "border-red-500",
      });
    }

    if (machine.vibration > 0.7) {
      insights.push({
        title: `${machine.name} Vibration`,
        message: `High vibration detected (${machine.vibration.toFixed(
          2
        )}). Check bearings and alignment.`,
        color: "border-yellow-500",
      });
    }

    if (machine.health < 60) {
      insights.push({
        title: `${machine.name} Health`,
        message: `Machine health is ${machine.health.toFixed(
          0
        )}%. Schedule preventive maintenance.`,
        color: "border-orange-500",
      });
    }

    if (machine.power > 80) {
      insights.push({
        title: `${machine.name} Energy`,
        message: `Power usage is unusually high (${machine.power.toFixed(
          0
        )} kW). Investigate load conditions.`,
        color: "border-blue-500",
      });
    }
  });

  if (insights.length === 0) {
    insights.push({
      title: "Factory Status",
      message: "All monitored machines are operating within normal limits.",
      color: "border-green-500",
    });
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        🤖 AI Insights
      </h2>

      <div className="space-y-4">
        {insights.map((item, index) => (
          <div
            key={index}
            className={`rounded-xl border-l-4 ${item.color} bg-slate-800 p-4`}
          >
            <h3 className="text-white font-semibold">
              {item.title}
            </h3>

            <p className="text-slate-300 mt-2">
              {item.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}