import { fetchJson } from "./api";
import type {
  PredictiveMachineDetailResponse,
  PredictiveOverviewResponse,
  PredictiveSimulationResponse,
} from "@/types/predictive";

export const fetchPredictiveOverview = () =>
  fetchJson<PredictiveOverviewResponse>("/api/predictive/overview");

export const fetchPredictiveMachine = (machineId: string) =>
  fetchJson<PredictiveMachineDetailResponse>(
    `/api/predictive/${encodeURIComponent(machineId)}`
  );

export const runPredictiveSimulation = (payload: {
  machineId: string;
  name?: string;
  eventType?: string;
  overrides: Record<string, number | string>;
}) =>
  fetchJson<PredictiveSimulationResponse>("/api/predictive/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
