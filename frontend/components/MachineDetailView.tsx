"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { canManagePlant, useStoredUser } from "@/lib/auth";
import { getAlerts, getMachine, getUsers } from "@/lib/data";
import { relativeTime, statusColor } from "@/lib/format";
import { SOCKET_EVENTS, useSocketEvent } from "@/lib/socket";
import type { Alert, Machine, ManagedUser, Reading } from "@/types";
import WorkOrderForm from "./WorkOrderForm";

// Latest reading per metric (backend returns readings newest-first).
const latestPerMetric = (readings: Reading[]) => {
  const seen = new Map<string, Reading>();
  for (const r of readings) {
    if (!seen.has(r.metric)) {
      seen.set(r.metric, r);
    }
  }
  return [...seen.values()];
};

export default function MachineDetailView({ machineId }: { machineId: string }) {
  const user = useStoredUser();
  const isManager = canManagePlant(user);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [engineers, setEngineers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [detail, machineAlerts] = await Promise.all([
        getMachine(machineId),
        getAlerts({ machineId }),
      ]);
      setMachine(detail.machine);
      setReadings(detail.readings);
      setAlerts(machineAlerts);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load machine");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  useEffect(() => {
    if (isManager) {
      void getUsers()
        .then((r) => setEngineers(r.users.filter((u) => u.role === "Engineer")))
        .catch(() => {});
    }
  }, [isManager]);

  const onLive = useCallback(() => void load(), [load]);
  useSocketEvent(SOCKET_EVENTS.MACHINE_UPDATE, onLive);
  useSocketEvent(SOCKET_EVENTS.ALERT_CREATED, onLive);

  const latest = useMemo(() => latestPerMetric(readings), [readings]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading machine…</p>;
  }
  if (error || !machine) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {error || "Machine not found"}
      </p>
    );
  }

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{machine.name}</h1>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(machine.status)}`}>
          {machine.status}
        </span>
        <span className="text-sm text-slate-500">
          Health {Math.round(machine.healthScore)} · {machine.location || "—"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold text-slate-700">Latest readings</h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {latest.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={4}>
                      No readings yet.
                    </td>
                  </tr>
                ) : (
                  latest.map((r) => (
                    <tr key={r.metric} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-900">{r.metric}</td>
                      <td className="px-4 py-2 text-slate-700">
                        {r.value} {r.unit}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {r.source === "sim" ? "sim (demo)" : "device"}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{relativeTime(r.ts)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mt-6 text-sm font-semibold text-slate-700">Thresholds</h2>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            {machine.thresholds && machine.thresholds.length > 0 ? (
              <ul className="space-y-1">
                {machine.thresholds.map((t) => (
                  <li key={t.metric}>
                    <span className="font-medium">{t.metric}</span>{" "}
                    {t.warnMax != null ? `warn>${t.warnMax} ` : ""}
                    {t.critMax != null ? `crit>${t.critMax} ` : ""}
                    {t.warnMin != null ? `warn<${t.warnMin} ` : ""}
                    {t.critMin != null ? `crit<${t.critMin}` : ""}
                    {t.unit ? ` ${t.unit}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No thresholds configured.</p>
            )}
          </div>

          {alerts.length > 0 ? (
            <>
              <h2 className="mt-6 text-sm font-semibold text-slate-700">Active alerts</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {alerts.map((a) => (
                  <li key={a.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-900">{a.metric}</span> {a.severity} ·{" "}
                    {a.breachValue} · {a.status}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section>
          {isManager ? (
            <WorkOrderForm
              machineId={machine.machineId}
              engineers={engineers}
              linkedAlertId={alerts[0]?.id}
              onCreated={() => void load()}
            />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Only a manager can raise a work order for this machine.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
