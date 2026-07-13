"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import FactoryScene from "@/components/3d/FactoryScene";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const data = await fetchMachines();

        setMachines(Array.isArray(data) ? data : []);
        setError(null);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load machines"
        );
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
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Assets
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Machine Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Search, inspect, and monitor connected industrial machines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/machines/add")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            <Plus size={18} />
            Add Machine
          </button>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <label className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 focus-within:border-cyan-400/60">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search machine, ID, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ml-3 min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>

      <div className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-700">

        <table className="min-w-[980px] w-full">

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
                  className="py-12 text-center text-cyan-300"
                >
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Loader2 size={18} className="animate-spin" />
                    Loading machines
                  </span>
                </td>
              </tr>
            ) : filteredMachines.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-slate-400"
                >
                  No machines match this view.
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
                    {Number(machine.temperature ?? 0).toFixed(1)} C
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

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          Digital Twin Factory
        </h2>

        <FactoryScene />
      </section>

      </div>
    </DashboardLayout>
  );
}
