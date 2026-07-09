// The single typed data layer. Every page reads/writes through these functions
// (never a raw fetch, never a hardcoded URL) so auth, the base URL, token
// refresh and the redirect-on-401 all happen in one place.

import { apiUrl, fetchJson } from "./api";
import type {
  Alert,
  AuthUser,
  KpiResponse,
  Machine,
  ManagedUser,
  Reading,
  Role,
  WorkOrder,
  WorkOrderPriority,
} from "@/types";

const jsonInit = (method: string, body: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const toQuery = (params?: Record<string, string | undefined>) => {
  if (!params) {
    return "";
  }
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) {
    return "";
  }
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
};

// --- auth -----------------------------------------------------------------
export interface LoginResult {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export const login = (email: string, password: string) =>
  fetchJson<LoginResult>("/api/auth/login", {
    ...jsonInit("POST", { email, password }),
    skipAuthRedirect: true,
  });

export const storeSession = (result: LoginResult) => {
  localStorage.setItem("token", result.token);
  if (result.refreshToken) {
    localStorage.setItem("refreshToken", result.refreshToken);
  }
  if (result.user) {
    localStorage.setItem("user", JSON.stringify(result.user));
  }
  window.dispatchEvent(new Event("kavach:auth-changed"));
};

export const logout = () => {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (refreshToken) {
    // Best-effort server-side revoke; ignore failures.
    void fetchJson("/api/auth/logout", {
      ...jsonInit("POST", { refreshToken }),
      skipAuthRedirect: true,
    }).catch(() => {});
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("kavach:auth-changed"));
};

// --- KPIs -----------------------------------------------------------------
export const getKpis = (params?: { from?: string; to?: string; windowHours?: string; machineId?: string }) =>
  fetchJson<KpiResponse>(`/api/kpis${toQuery(params)}`);

// --- machines -------------------------------------------------------------
export const getMachines = () =>
  fetchJson<{ machines: Machine[] }>("/api/machines").then((r) => r.machines);

export const getMachine = (machineId: string) =>
  fetchJson<{ machine: Machine; readings: Reading[] }>(
    `/api/machines/${encodeURIComponent(machineId)}`
  );

// --- alerts ---------------------------------------------------------------
export const getAlerts = (params?: { status?: string; machineId?: string }) =>
  fetchJson<{ alerts: Alert[] }>(`/api/alerts${toQuery(params)}`).then((r) => r.alerts);

export const acknowledgeAlert = (id: string) =>
  fetchJson<{ alert: Alert }>(`/api/alerts/${id}/acknowledge`, { method: "PATCH" }).then(
    (r) => r.alert
  );

// --- work orders ----------------------------------------------------------
export const getWorkOrders = (params?: { status?: string; machineId?: string }) =>
  fetchJson<{ workOrders: WorkOrder[] }>(`/api/workorders${toQuery(params)}`).then(
    (r) => r.workOrders
  );

export interface CreateWorkOrderInput {
  machineId: string;
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  assigneeId?: string;
  linkedAlertId?: string;
}

export const createWorkOrder = (input: CreateWorkOrderInput) =>
  fetchJson<{ workOrder: WorkOrder }>("/api/workorders", jsonInit("POST", input)).then(
    (r) => r.workOrder
  );

export const updateWorkOrder = (
  id: string,
  patch: Partial<Pick<WorkOrder, "status" | "priority" | "title" | "description" | "assigneeId">>
) =>
  fetchJson<{ workOrder: WorkOrder }>(`/api/workorders/${id}`, jsonInit("PATCH", patch)).then(
    (r) => r.workOrder
  );

// --- users (admin) --------------------------------------------------------
export const getUsers = () =>
  fetchJson<{ users: ManagedUser[]; roles: Role[] }>("/api/users");

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) => fetchJson<{ user: ManagedUser }>("/api/users", jsonInit("POST", input)).then((r) => r.user);

export const updateUser = (id: string, patch: { role?: Role; status?: string }) =>
  fetchJson<{ user: ManagedUser }>(`/api/users/${id}`, jsonInit("PATCH", patch)).then(
    (r) => r.user
  );

// --- reports --------------------------------------------------------------
// Downloads the CSV export through the token-attaching fetch layer, then hands
// the browser a blob to save (a plain <a href> couldn't attach the bearer).
export const downloadKpiReportCsv = async (params?: { from?: string; to?: string }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(apiUrl(`/api/reports/kpis?format=csv${params?.from ? `&from=${params.from}` : ""}${params?.to ? `&to=${params.to}` : ""}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to download report");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kavach-kpi-report.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
