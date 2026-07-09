import type { MachineStatus } from "@/types";

// Render a KPI fraction (0..1) as a percentage, or an em-dash when the data is
// incomplete (null) — the UI never invents a number.
export const pct = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : `${(value * 100).toFixed(1)}%`;

export const hoursLabel = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : `${value.toFixed(1)} h`;

export const statusColor = (status?: MachineStatus | string) => {
  switch (status) {
    case "Critical":
      return "text-red-700 bg-red-50 border-red-200";
    case "Warning":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "Running":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

export const relativeTime = (iso?: string) => {
  if (!iso) {
    return "—";
  }
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return "—";
  }
  return new Date(then).toLocaleString();
};
