"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { canManagePlant, canManageWorkOrders, useStoredUser } from "@/lib/auth";
import { getMachines, getUsers, getWorkOrders, updateWorkOrder } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import { SOCKET_EVENTS, useSocketEvent } from "@/lib/socket";
import type { Machine, ManagedUser, WorkOrder, WorkOrderStatus } from "@/types";
import WorkOrderForm from "./WorkOrderForm";

// The next lifecycle step an assignee/manager can take from the current status
// (Assigned → In Progress → Resolved). Open work orders are advanced by being
// assigned at creation, so they have no one-click advance here.
const advanceableTo = (status: WorkOrderStatus): WorkOrderStatus | null => {
  if (status === "Assigned") return "In Progress";
  if (status === "In Progress") return "Resolved";
  return null;
};

export default function WorkOrdersView() {
  const user = useStoredUser();
  const canMutate = canManageWorkOrders(user);
  const isManager = canManagePlant(user);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [engineers, setEngineers] = useState<ManagedUser[]>([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setWorkOrders(await getWorkOrders());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  // Managers need machines to target and engineers to assign.
  useEffect(() => {
    if (!isManager) {
      return;
    }
    void getMachines().then(setMachines).catch(() => {});
    void getUsers()
      .then((r) => setEngineers(r.users.filter((u) => u.role === "Engineer")))
      .catch(() => {});
  }, [isManager]);

  const onLive = useCallback(() => void load(), [load]);
  useSocketEvent(SOCKET_EVENTS.WORKORDER_UPDATE, onLive);

  const advance = async (workOrder: WorkOrder) => {
    const next = advanceableTo(workOrder.status);
    if (!next) return;
    try {
      await updateWorkOrder(workOrder.id, { status: next });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update work order");
    }
  };

  const machineName = useMemo(() => {
    const map = new Map(machines.map((m) => [m.machineId, m.name]));
    return (id: string) => map.get(id) ?? id;
  }, [machines]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Work orders</h1>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {isManager ? (
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600" htmlFor="wo-machine">
            Machine
          </label>
          <select
            id="wo-machine"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a machine…</option>
            {machines.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.name} ({m.machineId})
              </option>
            ))}
          </select>
          {selectedMachine ? (
            <div className="mt-3">
              <WorkOrderForm
                machineId={selectedMachine}
                engineers={engineers}
                onCreated={() => void load()}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Machine</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Updated</th>
              {canMutate ? <th className="px-4 py-2">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={6}>
                  No work orders.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => {
                const next = advanceableTo(wo.status);
                return (
                  <tr key={wo.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-900">{wo.title}</td>
                    <td className="px-4 py-2">
                      <Link href={`/machines/${wo.machineId}`} className="text-slate-700 hover:underline">
                        {machineName(wo.machineId)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{wo.priority}</td>
                    <td className="px-4 py-2 text-slate-700">{wo.status}</td>
                    <td className="px-4 py-2 text-slate-500">{relativeTime(wo.updatedAt)}</td>
                    {canMutate ? (
                      <td className="px-4 py-2">
                        {next ? (
                          <button
                            type="button"
                            onClick={() => advance(wo)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            Mark {next}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
