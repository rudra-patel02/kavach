"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import FactoryScene from "@/components/3d/FactoryScene";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useMachineFeed } from "@/hooks/useMachineFeed";
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
  const machines = useMachineFeed() as Machine[];
  const loading = machines.length === 0;
  const router = useRouter();

  const filteredMachines = useMemo(() => machines.filter((machine) => {
    const searchText = search.toLowerCase();

    return (
      machine.name?.toLowerCase().includes(searchText) ||
      machine.machineId?.toLowerCase().includes(searchText) ||
      machine.department?.toLowerCase().includes(searchText)
    );
  }), [machines, search]);

  return (
    <DashboardLayout>
      <div className="page-stack space-y-6 text-white surface-enter">
        <section className="premium-card rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-eyebrow">
              Assets
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Machine Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Search, inspect, and monitor connected industrial machines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/machines/add")}
            className="premium-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          >
            <Plus size={18} />
            Add Machine
          </button>
          </div>
        </section>

        <label className="premium-input flex items-center rounded-xl px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search machine, ID, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ml-3 min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>

      <div className="premium-card overflow-x-auto rounded-2xl">

        <table className="min-w-[980px] w-full text-sm">

          <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-500">
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
                  className="border-b border-slate-800/80 transition hover:bg-cyan-400/5"
                >
                  <td className="p-4">{machine.machineId}</td>

                  <td className="p-4">{machine.name}</td>

                  <td className="p-4">{machine.department}</td>

                  <td className="p-4">
                    <span
                      className={`status-pill ${
                        machine.status === "Running"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : machine.status === "Warning"
                          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                          : machine.status === "Critical"
                          ? "border-red-400/30 bg-red-500/10 text-red-200"
                          : "border-slate-500/30 bg-slate-700/50 text-slate-300"
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
                      className={`status-pill ${
                        machine.aiPrediction?.failureRisk === "High"
                          ? "border-red-400/30 bg-red-500/10 text-red-200"
                          : machine.aiPrediction?.failureRisk === "Medium"
                          ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
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
                      className="premium-button rounded-lg px-3 py-1.5 text-sm font-semibold"
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

      <section className="premium-card rounded-2xl p-5">
        <h2 className="mb-4 text-2xl font-black">
          Digital Twin Factory
        </h2>

        <FactoryScene />
      </section>

      </div>
    </DashboardLayout>
  );
}
