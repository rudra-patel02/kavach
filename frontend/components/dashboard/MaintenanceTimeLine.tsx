"use client";

import { useEffect, useState } from "react";
import socket from "@/lib/socket";

type Machine = {
  name: string;
  health: number;
  status: string;
};

export default function MaintenanceTimeline() {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/machines")
      .then((res) => res.json())
      .then((data: Machine[]) => {
        setMachines(data);
      })
      .catch((err) => console.error(err));

    const handleMachineUpdate = (updatedMachines: Machine[]) => {
      setMachines(updatedMachines);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  const schedule = machines
    .filter((machine) => machine.health < 90)
    .sort((a, b) => a.health - b.health);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        🔧 Maintenance Timeline
      </h2>

      <div className="space-y-4">
        {schedule.length === 0 ? (
          <p className="text-green-400">
            No maintenance currently required.
          </p>
        ) : (
          schedule.map((machine) => (
            <div
              key={machine.name}
              className="rounded-xl bg-slate-800 border border-slate-700 p-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">
                  {machine.name}
                </h3>

                <span className="text-cyan-400 font-semibold">
                  {machine.health.toFixed(0)}%
                </span>
              </div>

              <p className="mt-2 text-slate-300">
                {machine.health < 50
                  ? "🚨 Immediate inspection required."
                  : machine.health < 70
                  ? "⚠️ Maintenance recommended within 3 days."
                  : "🛠️ Routine maintenance recommended within 7 days."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}