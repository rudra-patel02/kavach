"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createMachine as createMachineRequest } from "@/lib/machines";

export default function AddMachinePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    machineId: "",
    name: "",
    department: "Production",
    status: "Running",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createMachine = async () => {
    setLoading(true);
    setError(null);

    try {
      await createMachineRequest(form);

      router.push("/machines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create machine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 text-white">
        <button
          type="button"
          onClick={() => router.push("/machines")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Back to machines
        </button>

        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Assets
          </p>
          <h1 className="mt-2 text-3xl font-bold">Add New Machine</h1>
          <p className="mt-2 text-sm text-slate-400">
            Register a machine with its plant department and initial status.
          </p>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">

        <input
          name="machineId"
          placeholder="Machine ID"
          value={form.machineId}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        />

        <input
          name="name"
          placeholder="Machine Name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        />

        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        >
          <option>Production</option>
          <option>Maintenance</option>
          <option>Packaging</option>
          <option>Utilities</option>
        </select>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        >
          <option>Running</option>
          <option>Warning</option>
          <option>Critical</option>
          <option>Stopped</option>
        </select>

        <button
          type="button"
          onClick={createMachine}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? "Creating machine" : "Create Machine"}
        </button>

          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
