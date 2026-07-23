import { authenticatedFetch, fetchJson } from "./api";

export type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "machine"
  | "maintenance"
  | "plant-health"
  | "energy"
  | "prediction"
  | "executive"
  | "automated-executive";

export type ReportFormat = "pdf" | "csv" | "excel";

export interface ReportCatalogResponse {
  success: boolean;
  types: Record<ReportType, string>;
  periods: string[];
  formats: string[];
}

export const fetchReportCatalog = () =>
  fetchJson<ReportCatalogResponse>("/api/reports");

export const downloadReport = async (
  type: ReportType,
  format: ReportFormat = "pdf"
) => {
  const path =
    format === "pdf"
      ? `/api/reports/${type}/pdf`
      : `/api/reports/${type}?format=${format}`;
  const response = await authenticatedFetch(path);

  if (!response.ok) {
    throw new Error(`Report download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers.get("content-disposition") || "";
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] ||
    `kavach-${type}-report.${format === "excel" ? "xls" : format}`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadReportPdf = (type: ReportType) => downloadReport(type, "pdf");
