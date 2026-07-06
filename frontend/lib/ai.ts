import { fetchJson } from "./api";
import type {
  AIExecutiveInsightsResponse,
  AIFleetHealthResponse,
  AIHistoryResponse,
  AIMachineResponse,
  AIOverviewResponse,
} from "@/types/ai";

export const fetchAIOverview = () =>
  fetchJson<AIOverviewResponse>("/api/ai/overview");

export const fetchMachineAI = (machineId: string) =>
  fetchJson<AIMachineResponse>(`/api/ai/machine/${encodeURIComponent(machineId)}`);

export const analyzeMachineAI = (
  machineId: string,
  payload: { metrics?: Record<string, number>; persist?: boolean } = {}
) =>
  fetchJson<AIMachineResponse>(
    `/api/ai/machine/${encodeURIComponent(machineId)}/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

export const fetchAIHistory = (query: {
  machineId?: string;
  eventType?: string;
  limit?: number;
  page?: number;
} = {}) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<AIHistoryResponse>(`/api/ai/history${suffix}`);
};

export const fetchFleetHealth = () =>
  fetchJson<AIFleetHealthResponse>("/api/ai/fleet-health");

export const fetchExecutiveInsights = () =>
  fetchJson<AIExecutiveInsightsResponse>("/api/ai/executive-insights");

export const generateMaintenancePlan = (machineId: string) =>
  fetchJson<AIMachineResponse & { maintenancePlan?: unknown }>(
    `/api/ai/planner/${encodeURIComponent(machineId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
