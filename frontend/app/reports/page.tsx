"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  downloadReport,
  fetchReportCatalog,
  type ReportCatalogResponse,
  type ReportFormat,
  type ReportType,
} from "@/lib/reports";

const reportRoles = [
  "Super Admin",
  "Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];

export default function ReportsPage() {
  const [catalog, setCatalog] = useState<ReportCatalogResponse | null>(null);
  const [selectedType, setSelectedType] = useState<ReportType>("executive");
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportCatalog()
      .then((response) => {
        setCatalog(response);
        setError(null);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load report catalog"
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadReport(selectedType, selectedFormat);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Report download failed"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const reportEntries = Object.entries(catalog?.types || {}) as [
    ReportType,
    string,
  ][];

  return (
    <DashboardLayout allowedRoles={reportRoles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section>
          <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
            <FileText size={18} />
            Reporting Center
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Enterprise Reports
          </h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Daily, weekly, monthly, quarterly, machine, energy, maintenance,
            prediction, and executive reports with PDF, Excel, and CSV export.
          </p>
        </section>

        {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 text-slate-300"
            >
              <Loader2 size={18} className="animate-spin text-cyan-300" aria-hidden="true" />
              Loading report catalog
            </div>
          ) : reportEntries.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center">
              <FileText size={28} className="mx-auto text-slate-500" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-bold text-white">
                No Reports Available
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                The report catalog is empty or temporarily unavailable. Retry
                after the backend finishes waking up.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_220px]">
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as ReportType)}
                aria-label="Report type"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                {reportEntries.map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={selectedFormat}
                onChange={(event) =>
                  setSelectedFormat(event.target.value as ReportFormat)
                }
                aria-label="Report format"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isDownloading || reportEntries.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download size={16} aria-hidden="true" />
                )}
                Export
              </button>
            </div>
          )}
        </section>

        {reportEntries.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reportEntries.map(([type, label]) => (
              <article
                key={type}
                className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5"
              >
                <p className="text-lg font-bold text-white">{label}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Export as PDF, Excel-compatible workbook, or CSV.
                </p>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
