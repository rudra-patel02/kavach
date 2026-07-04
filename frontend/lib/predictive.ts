import { fetchJson } from "./api";
import type { PredictiveOverviewResponse } from "@/types/predictive";

export const fetchPredictiveOverview = () =>
  fetchJson<PredictiveOverviewResponse>("/api/predictive/overview");
