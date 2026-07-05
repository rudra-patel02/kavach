import { fetchJson } from "./api";
import type {
  PredictiveMachineDetailResponse,
  PredictiveOverviewResponse,
} from "@/types/predictive";

export const fetchPredictiveOverview = () =>
  fetchJson<PredictiveOverviewResponse>("/api/predictive/overview");

export const fetchPredictiveMachine = (machineId: string) =>
  fetchJson<PredictiveMachineDetailResponse>(
    `/api/predictive/${encodeURIComponent(machineId)}`
  );
