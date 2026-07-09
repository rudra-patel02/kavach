"use client";

import { useEffect, useState } from "react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

export default function LiveAlerts() {
  const [machines, setMachines] = useState<MachineData[]>([]);

  useEffect(() => {
    fetchMachines()
      .then((data) => setMachines(data));

    const handleMachineUpdate = (data: MachineData[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  const alerts: {
    status: string;
    color: string;
    message: string;
  }[] = [];

  machines.forEach((machine) => {
    if (machine.status === "Critical") {
      alerts.push({
        status: "CRITICAL",
        color: "text-red-400",
        message: `${machine.name} requires immediate attention.`,
      });
    }

    if (machine.status === "Warning") {
      alerts.push({
        status: "WARNING",
        color: "text-yellow-400",
        message: `${machine.name} is showing abnormal behaviour.`,
      });
    }

    if (machine.temperature > 90) {
      alerts.push({
        status: "TEMP",
        color: "text-orange-400",
        message: `${machine.name} temperature is ${machine.temperature.toFixed(
          1
        )}°C.`,
      });
    }

    if (machine.health < 50) {
      alerts.push({
        status: "HEALTH",
        color: "text-pink-400",
        message: `${machine.name} health dropped to ${machine.health.toFixed(
          0
        )}%.`,
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      status: "SUCCESS",
      color: "text-green-400",
      message: "All factory systems are operating normally.",
    });
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        🚨 Live Alerts
      </h2>

      <div className="space-y-4 max-h-[420px] overflow-y-auto">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="rounded-xl bg-slate-800 border border-slate-700 p-4 flex justify-between items-center"
          >
            <span className={`font-bold ${alert.color}`}>
              {alert.status}
            </span>

            <span className="text-slate-200">
              {alert.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
