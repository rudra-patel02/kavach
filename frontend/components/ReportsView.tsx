"use client";

import { useCallback, useEffect, useState } from "react";

import { downloadKpiReportCsv, getKpis } from "@/lib/data";
import { hoursLabel, pct } from "@/lib/format";
import type { KpiResponse } from "@/types";

const WINDOWS = [
  { label: "Last 24 hours", hours: "24" },
  { label: "Last 7 days", hours: "168" },
  { label: "Last 30 days", hours: "720" },
];

// Preview the exact KPI numbers that the export will contain, then download the
// CSV. The preview uses the same computeKpis the dashboard uses, so what you see
// is what you export — nothing fabricated.
export default function ReportsView() {
  const [windowHours, setWindowHours] = useState("720");
  const [data, setData] = useState<KpiResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getKpis({ windowHours }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data");
    }
  }, [windowHours]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  const download = async () => {
    setBusy(true);
    try {
      await downloadKpiReportCsv(
        data ? { from: data.window.from, to: data.window.to } : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
      <p className="mt-1 text-sm text-slate-500">
        Export the plant’s real KPIs. The numbers match the dashboard exactly.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="report-window">
            Window
          </label>
          <select
            id="report-window"
            value={windowHours}
            onChange={(e) => setWindowHours(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {WINDOWS.map((w) => (
              <option key={w.hours} value={w.hours}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Preparing…" : "Download CSV"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Plant OEE" value={pct(data.plant.oee)} />
          <Stat label="Availability" value={pct(data.plant.availability)} />
          <Stat label="MTBF" value={hoursLabel(data.plant.mtbfHours)} />
          <Stat label="MTTR" value={hoursLabel(data.plant.mttrHours)} />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
