import { computeKpis } from "../services/kpiQuery.js";

// Format a KPI fraction (0..1) as a percentage string, or "n/a" when the
// underlying data is incomplete (null) — never a fabricated number.
const pct = (value) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "n/a"
    : `${(value * 100).toFixed(1)}%`;

const hours = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : "0.00";

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = ({ window, plant, machines }) => {
  const rows = [];
  rows.push(["KAVACH plant KPI report"]);
  rows.push(["Window", window.from, window.to]);
  rows.push([]);
  rows.push([
    "Scope",
    "Machine",
    "Status",
    "OEE",
    "Availability",
    "Performance",
    "Quality",
    "MTBF (h)",
    "MTTR (h)",
    "Failures",
    "Data complete",
  ]);
  rows.push([
    "PLANT",
    "-",
    "-",
    pct(plant.oee),
    pct(plant.availability),
    pct(plant.performance),
    pct(plant.quality),
    hours(plant.mtbfHours),
    hours(plant.mttrHours),
    String(plant.failures),
    String(plant.dataComplete),
  ]);
  for (const m of machines) {
    rows.push([
      "MACHINE",
      m.name || m.machineId,
      m.status || "",
      pct(m.oee),
      pct(m.availability),
      pct(m.performance),
      pct(m.quality),
      hours(m.mtbfHours),
      hours(m.mttrHours),
      String(m.failures),
      String(m.dataComplete),
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
};

// GET /api/reports/kpis — export the real plant + per-machine KPIs over a
// window. Numbers come from the same computeKpis() the dashboard uses, so the
// report and the dashboard always agree. ?format=csv (default json).
export const exportKpiReport = async (req, res) => {
  try {
    const report = await computeKpis(req.query);
    const format = String(req.query.format || "json").toLowerCase();

    if (format === "csv") {
      const filename = `kavach-kpi-report-${report.window.to.slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(toCsv(report));
    }

    return res.json({ success: true, ...report });
  } catch (error) {
    console.error("Report export failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
};
