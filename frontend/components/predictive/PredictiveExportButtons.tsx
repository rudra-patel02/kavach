"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { PredictiveOverview } from "@/types/predictive";

interface PredictiveExportButtonsProps {
  overview: PredictiveOverview;
}

const escapeCsv = (value: string | number) => {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function PredictiveExportButtons({
  overview,
}: PredictiveExportButtonsProps) {
  const exportExcel = () => {
    const headers = [
      "Rank",
      "Machine ID",
      "Machine",
      "Department",
      "Health %",
      "Failure Probability %",
      "RUL Hours",
      "AI Confidence %",
      "Risk Level",
      "Maintenance Priority",
    ];
    const rows = overview.ranking.map((row) => [
      row.rank,
      row.machineId,
      row.name,
      row.department,
      row.machineHealth,
      row.failureProbability,
      row.remainingUsefulLifeHours,
      row.aiConfidence,
      row.riskLevel,
      row.maintenancePriority,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    downloadFile("kavach-predictive-maintenance.csv", csv, "text/csv");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-400/20"
      >
        <FileText size={18} />
        PDF
      </button>

      <button
        type="button"
        onClick={exportExcel}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/20"
      >
        <FileSpreadsheet size={18} />
        Excel
      </button>

      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
        <Download size={18} />
        Generated {new Date(overview.generatedAt).toLocaleTimeString()}
      </span>
    </div>
  );
}
