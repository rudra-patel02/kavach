"use client";

import { useEffect, useState } from "react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";

type Machine = {
  status: string;
  health: number;
  temperature: number;
};

export default function ProductionAnalytics() {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    fetchMachines()
      .then(setMachines);

    const handleUpdate = (data: Machine[]) => {
      setMachines(data);
    };

    socket.on("machineUpdate", handleUpdate);

    return () => {
      socket.off("machineUpdate", handleUpdate);
    };
  }, []);

  const running = machines.filter((m) => m.status === "Running").length;
  const warning = machines.filter((m) => m.status === "Warning").length;
  const critical = machines.filter((m) => m.status === "Critical").length;

  const avgHealth =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + m.health, 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const avgTemp =
    machines.length > 0
      ? (
          machines.reduce((sum, m) => sum + m.temperature, 0) /
          machines.length
        ).toFixed(1)
      : "0";

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        📊 Production Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400">Running</p>
          <h3 className="text-3xl font-bold text-green-400">{running}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400">Warning</p>
          <h3 className="text-3xl font-bold text-yellow-400">{warning}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400">Critical</p>
          <h3 className="text-3xl font-bold text-red-500">{critical}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400">Avg Health</p>
          <h3 className="text-3xl font-bold text-cyan-400">
            {avgHealth}%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400">Avg Temp</p>
          <h3 className="text-3xl font-bold text-orange-400">
            {avgTemp}°C
          </h3>
        </div>
      </div>
    </div>
  );
}
