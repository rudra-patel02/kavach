"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FactoryScene from "@/components/3d/FactoryScene";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";

type Machine = {
  _id: string;
  machineId: string;
  name: string;
  department: string;
  status: string;
  health: number;
  temperature: number;
  aiPrediction?: {
    failureRisk: string;
    maintenancePriority: string;
    maintenanceInDays: number;
  };
};

export default function MachinesPage() {
  const [search, setSearch] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const data = await fetchMachines();

        setMachines(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Machine API Error:", error);
        setMachines([]);
      } finally {
        setLoading(false);
      }
    };

    loadMachines();

    const handleMachineUpdate = (updatedMachines: Machine[]) => {
      setMachines(updatedMachines);
    };

    socket.on("machineUpdate", handleMachineUpdate);

    return () => {
      socket.off("machineUpdate", handleMachineUpdate);
    };
  }, []);

  const filteredMachines = machines.filter((machine) => {
    const searchText = search.toLowerCase();

    return (
      machine.name?.toLowerCase().includes(searchText) ||
      machine.machineId?.toLowerCase().includes(searchText) ||
      machine.department?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <div className="flex justify-between items-center mb-6">

  <h1 className="text-4xl font-bold">
    Machine Management
  </h1>

  <button
    onClick={() => router.push("/machines/add")}
    className="bg-cyan-600 hover:bg-cyan-700 px-5 py-3 rounded-lg font-semibold"
  >
    + Add Machine
  </button>

</div>

      <input
        type="text"
        placeholder="🔍 Search Machine..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 mb-6 outline-none"
      />

      <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-800">
            <tr>
              <th className="text-left p-4">Machine ID</th>
              <th className="text-left p-4">Machine</th>
              <th className="text-left p-4">Department</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Health</th>
              <th className="text-left p-4">Temperature</th>
              <th className="text-left p-4">AI Risk</th>
              <th className="text-left p-4">Maintenance</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-10 text-cyan-400"
                >
                  Loading Machines...
                </td>
              </tr>
            ) : filteredMachines.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-10 text-red-400"
                >
                  No Machines Found
                </td>
              </tr>
            ) : (
              filteredMachines.map((machine) => (
                <tr
                  key={machine._id}
                  className="border-b border-slate-800 hover:bg-slate-800 transition"
                >
                  <td className="p-4">{machine.machineId}</td>

                  <td className="p-4">{machine.name}</td>

                  <td className="p-4">{machine.department}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        machine.status === "Running"
                          ? "bg-green-600"
                          : machine.status === "Warning"
                          ? "bg-yellow-500 text-black"
                          : machine.status === "Critical"
                          ? "bg-red-600"
                          : "bg-gray-600"
                      }`}
                    >
                      {machine.status}
                    </span>
                  </td>

                  <td
                    className={`p-4 font-bold ${
                      machine.health >= 90
                        ? "text-green-400"
                        : machine.health >= 60
                        ? "text-yellow-400"
                        : "text-red-500"
                    }`}
                  >
                    {Number(machine.health ?? 0).toFixed(1)}%
                  </td>

                  <td
                    className={`p-4 font-bold ${
                      Number(machine.temperature ?? 0) < 70
                        ? "text-green-400"
                        : Number(machine.temperature ?? 0) < 90
                        ? "text-yellow-400"
                        : "text-red-500"
                    }`}
                  >
                    {Number(machine.temperature ?? 0).toFixed(1)}°C
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        machine.aiPrediction?.failureRisk === "High"
                          ? "bg-red-600"
                          : machine.aiPrediction?.failureRisk === "Medium"
                          ? "bg-yellow-500 text-black"
                          : "bg-green-600"
                      }`}
                    >
                      {machine.aiPrediction?.failureRisk ?? "Low"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {machine.aiPrediction?.maintenancePriority ?? "-"}
                      </div>

                      <div className="text-slate-400">
                        {machine.aiPrediction?.maintenanceInDays ?? "-"} days
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/machines/${machine.machineId}`}
                      className="bg-cyan-600 px-3 py-1 rounded hover:bg-cyan-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>

      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          🏭 Digital Twin Factory
        </h2>

        <FactoryScene />
      </div>

    </div>
  );
}
