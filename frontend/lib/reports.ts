import { apiUrl } from "./api";

export type ReportType =
  | "maintenance"
  | "plant-health"
  | "energy"
  | "weekly"
  | "monthly";

export const downloadReportPdf = async (type: ReportType) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(apiUrl(`/api/reports/${type}/pdf`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Report download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers.get("content-disposition") || "";
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] ||
    `kavach-${type}-report.pdf`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
