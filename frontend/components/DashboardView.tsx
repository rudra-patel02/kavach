"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getKpis } from "@/lib/data";
import { hoursLabel, pct, statusColor } from "@/lib/format";
import { SOCKET_EVENTS, useSocketEvent } from "@/lib/socket";
import type { KpiResponse, MachineKpi } from "@/types";

const WINDOWS = [
  { label: "24h", hours: "24" },
  { label: "7d", hours: "168" },
  { label: "30d", hours: "720" },
];

// The lowest-OEE machine with complete data — the one "dragging OEE down" that
// the OEE card drills into (key flow #1).
const worstMachine = (machines: MachineKpi[]) =>
  machines
    .filter((m) => m.dataComplete && m.oee !== null)
    .sort((a, b) => (a.oee ?? 1) - (b.oee ?? 1))[0] ?? null;

function KpiCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:ring-2 hover:ring-slate-300">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function DashboardView() {
  const [windowHours, setWindowHours] = useState("24");
  const [data, setData] = useState<KpiResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getKpis({ windowHours });
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  }, [windowHours]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  // Live updates: a telemetry ingest or a resolved work order nudges KPIs.
  const onLiveUpdate = useCallback(() => {
    void load();
  }, [load]);
  useSocketEvent(SOCKET_EVENTS.KPI_UPDATE, onLiveUpdate);
  useSocketEvent(SOCKET_EVENTS.MACHINE_UPDATE, onLiveUpdate);

  const plant = data?.plant;
  const machines = data?.machines ?? [];
  const worst = worstMachine(machines);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Plant overview</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {WINDOWS.map((w) => (
            <button
              key={w.hours}
              type="button"
              onClick={() => setWindowHours(w.hours)}
              className={`rounded-md px-3 py-1 ${
                windowHours === w.hours ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !plant ? (
        <p className="mt-4 text-sm text-slate-500">Loading KPIs…</p>
      ) : plant ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="OEE"
              value={pct(plant.oee)}
              href={worst ? `/machines/${worst.machineId}` : undefined}
              hint={worst ? `Drill into ${worst.name ?? worst.machineId}` : "No production data"}
            />
            <KpiCard label="Availability" value={pct(plant.availability)} />
            <KpiCard label="MTBF" value={hoursLabel(plant.mtbfHours)} />
            <KpiCard label="MTTR" value={hoursLabel(plant.mttrHours)} />
          </div>

          <h2 className="mt-8 text-sm font-semibold text-slate-700">Machine health</h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Machine</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Availability</th>
                  <th className="px-4 py-2">OEE</th>
                  <th className="px-4 py-2">Failures</th>
                </tr>
              </thead>
              <tbody>
                {machines.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={5}>
                      No machines yet.
                    </td>
                  </tr>
                ) : (
                  machines.map((m) => (
                    <tr key={m.machineId} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2">
                        <Link
                          href={`/machines/${m.machineId}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {m.name ?? m.machineId}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(m.status)}`}
                        >
                          {m.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-700">{pct(m.availability)}</td>
                      <td className="px-4 py-2 text-slate-700">{pct(m.oee)}</td>
                      <td className="px-4 py-2 text-slate-700">{m.failures}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Window {data?.window.from?.slice(0, 10)} → {data?.window.to?.slice(0, 10)}. Every number
            is computed from real readings; incomplete data shows “—”, never a guess.
          </p>
        </>
      ) : null}
    </div>
  );
}
