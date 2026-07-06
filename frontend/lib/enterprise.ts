import { apiUrl, fetchJson } from "./api";
import type {
  AuditLogsResponse,
  BackupConfigurationResponse,
  SystemHealthResponse,
  TenantOverviewResponse,
} from "@/types/enterprise";

export const fetchTenantOverview = () =>
  fetchJson<TenantOverviewResponse>("/api/tenants");

export const createOrganization = (payload: { name: string; industry?: string }) =>
  fetchJson("/api/tenants/organizations", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

export const createPlant = (payload: {
  location?: string;
  name: string;
  organizationId: string;
}) =>
  fetchJson("/api/tenants/plants", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

export const switchPlant = (plantId: string) =>
  fetchJson<{ activePlantId: string; success: boolean }>("/api/tenants/switch-plant", {
    body: JSON.stringify({ plantId }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

export const fetchAuditLogs = (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson<AuditLogsResponse>(`/api/audit${query ? `?${query}` : ""}`);
};

export const downloadAuditExport = async (format: "csv" | "excel" | "pdf") => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(apiUrl(`/api/audit/export/${format}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Audit export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kavach-audit-${Date.now()}.${
    format === "pdf" ? "pdf" : "csv"
  }`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const fetchSystemHealth = () =>
  fetchJson<SystemHealthResponse>("/api/system/health");

export const fetchBackupConfiguration = () =>
  fetchJson<BackupConfigurationResponse>("/api/backup/configuration");

export const downloadBackup = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(apiUrl("/api/backup/export"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Backup export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kavach-backup-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
