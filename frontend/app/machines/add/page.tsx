"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

    try {
      await createMachineRequest(form);

      alert("Machine Added Successfully");

      router.push("/machines");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center">

      <div className="bg-slate-900 p-8 rounded-xl w-[500px]">

        <h1 className="text-3xl font-bold text-white mb-8">
          Add New Machine
        </h1>

        <input
          name="machineId"
          placeholder="Machine ID"
          value={form.machineId}
          onChange={handleChange}
          className="w-full p-3 rounded bg-slate-800 text-white mb-4"
        />

        <input
          name="name"
          placeholder="Machine Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 rounded bg-slate-800 text-white mb-4"
        />

        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full p-3 rounded bg-slate-800 text-white mb-4"
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
          className="w-full p-3 rounded bg-slate-800 text-white mb-6"
        >
          <option>Running</option>
          <option>Warning</option>
          <option>Critical</option>
          <option>Stopped</option>
        </select>

        <button
          onClick={createMachine}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 p-3 rounded text-white font-bold"
        >
          {loading ? "Creating..." : "Create Machine"}
        </button>

      </div>

    </div>
  );
}
