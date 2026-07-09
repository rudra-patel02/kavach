"use client";

import { useState } from "react";

import { createWorkOrder } from "@/lib/data";
import type { ManagedUser, WorkOrder, WorkOrderPriority } from "@/types";

const PRIORITIES: WorkOrderPriority[] = ["Low", "Medium", "High", "Critical"];

// Create + assign a work order for a machine. Posts through the typed data layer
// (createWorkOrder → lib/api), never a raw fetch. Rendered only for Managers.
export default function WorkOrderForm({
  machineId,
  linkedAlertId,
  engineers = [],
  onCreated,
}: {
  machineId: string;
  linkedAlertId?: string;
  engineers?: ManagedUser[];
  onCreated?: (workOrder: WorkOrder) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    try {
      const workOrder = await createWorkOrder({
        machineId,
        title: title.trim(),
        priority,
        assigneeId: assigneeId || undefined,
        linkedAlertId,
      });
      setTitle("");
      setAssigneeId("");
      onCreated?.(workOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create work order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Create work order</h3>

      <label className="mt-3 block text-xs font-medium text-slate-600" htmlFor="wo-title">
        Title
      </label>
      <input
        id="wo-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="e.g. Investigate over-temperature"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="wo-priority">
            Priority
          </label>
          <select
            id="wo-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {engineers.length > 0 ? (
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="wo-assignee">
              Assign to
            </label>
            <select
              id="wo-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create work order"}
      </button>
    </form>
  );
}
