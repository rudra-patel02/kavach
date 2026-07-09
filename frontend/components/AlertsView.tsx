"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { canManagePlant, useStoredUser } from "@/lib/auth";
import { acknowledgeAlert, getAlerts } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import { SOCKET_EVENTS, useSocketEvent } from "@/lib/socket";
import type { Alert } from "@/types";

export default function AlertsView() {
  const user = useStoredUser();
  const isManager = canManagePlant(user);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setAlerts(await getAlerts());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  const onLive = useCallback(() => void load(), [load]);
  useSocketEvent(SOCKET_EVENTS.ALERT_CREATED, onLive);

  const ack = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to acknowledge alert");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Alerts</h1>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Machine</th>
              <th className="px-4 py-2">Metric</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={6}>
                  No active alerts — the plant is clean.
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-500">{relativeTime(a.ts)}</td>
                  <td className="px-4 py-2">
                    <Link href={`/machines/${a.machineId}`} className="text-slate-700 hover:underline">
                      {a.machineId}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-900">
                    {a.metric} = {a.breachValue}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        a.severity === "Critical"
                          ? "text-red-700"
                          : "text-amber-700"
                      }
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{a.status}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {isManager && a.status === "open" ? (
                        <button
                          type="button"
                          onClick={() => ack(a.id)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          Acknowledge
                        </button>
                      ) : null}
                      <Link
                        href={`/machines/${a.machineId}`}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Machine
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
