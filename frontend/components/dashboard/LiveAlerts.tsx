"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

export default function LiveAlerts() {
  const [machines, setMachines] = useState<MachineData[]>([]);

  useEffect(() => {
    fetchMachines().then((data) => setMachines(data));

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
        color: "text-red-300 border-red-400/30 bg-red-500/10",
        message: `${machine.name} requires immediate attention.`,
      });
    }

    if (machine.status === "Warning") {
      alerts.push({
        status: "WARNING",
        color: "text-yellow-300 border-yellow-400/30 bg-yellow-500/10",
        message: `${machine.name} is showing abnormal behaviour.`,
      });
    }

    if (machine.temperature > 90) {
      alerts.push({
        status: "TEMP",
        color: "text-orange-300 border-orange-400/30 bg-orange-500/10",
        message: `${machine.name} temperature is ${machine.temperature.toFixed(
          1
        )} C.`,
      });
    }

    if (machine.health < 50) {
      alerts.push({
        status: "HEALTH",
        color: "text-pink-300 border-pink-400/30 bg-pink-500/10",
        message: `${machine.name} health dropped to ${machine.health.toFixed(
          0
        )}%.`,
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      status: "SUCCESS",
      color: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
      message: "All factory systems are operating normally.",
    });
  }

  return (
    <div className="premium-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300/80">
        Safety
      </p>
      <h2 className="mb-6 mt-2 flex items-center gap-3 text-2xl font-black text-white">
        <AlertTriangle size={22} className="text-red-300" />
        Live Alerts
      </h2>

      <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {alerts.map((alert, index) => {
          const Icon = alert.status === "SUCCESS" ? CheckCircle2 : AlertTriangle;

          return (
            <div
              key={`${alert.status}-${index}`}
              className={`surface-enter rounded-xl border p-4 ${alert.color}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black tracking-[0.16em]">
                    {alert.status}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-200">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
