import { fetchJson } from "./api";
import type {
  EnterpriseAnalyticsResponse,
  EnterpriseDashboardResponse,
  EnterpriseEntity,
  EnterpriseFleetResponse,
  EnterpriseListResponse,
} from "@/types/enterpriseOps";

const withQuery = (path: string, query: Record<string, string | number | undefined> = {}) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `${path}${suffix}`;
};

export const fetchEnterpriseDashboard = () =>
  fetchJson<EnterpriseDashboardResponse>("/api/enterprise/dashboard");

export const fetchEnterpriseFleet = () =>
  fetchJson<EnterpriseFleetResponse>("/api/enterprise/fleet");

export const fetchCrossPlantAnalytics = () =>
  fetchJson<EnterpriseAnalyticsResponse>("/api/enterprise/analytics/cross-plant");

export const fetchEnterpriseList = <T extends EnterpriseEntity>(
  resource: string,
  query: Record<string, string | number | undefined> = {}
) =>
  fetchJson<EnterpriseListResponse<T>>(
    withQuery(`/api/enterprise/${resource}`, query)
  );

export const createEnterpriseEntity = <TResponse>(
  resource: string,
  payload: Record<string, unknown>
) =>
  fetchJson<TResponse>(`/api/enterprise/${resource}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

export const updateAssetLifecycle = (
  assetId: string,
  payload: { state: string; notes?: string }
) =>
  fetchJson(`/api/enterprise/assets/${encodeURIComponent(assetId)}/lifecycle`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

export const autoAssignWorkOrder = (workOrderId: string) =>
  fetchJson(
    `/api/enterprise/workorders/${encodeURIComponent(workOrderId)}/auto-assign`,
    {
      method: "POST",
    }
  );
