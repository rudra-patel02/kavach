import type { PredictiveRiskLevel } from "@/types/predictive";

export const riskTextClass: Record<PredictiveRiskLevel, string> = {
  Low: "text-emerald-300",
  Medium: "text-amber-300",
  High: "text-orange-300",
  Critical: "text-red-300",
};

export const riskBadgeClass: Record<PredictiveRiskLevel, string> = {
  Low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Medium: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  High: "border-orange-400/30 bg-orange-400/10 text-orange-200",
  Critical: "border-red-400/30 bg-red-400/10 text-red-200",
};

export const riskBorderClass: Record<PredictiveRiskLevel, string> = {
  Low: "border-emerald-400/30",
  Medium: "border-amber-400/30",
  High: "border-orange-400/30",
  Critical: "border-red-400/30",
};

export const riskChartColor: Record<PredictiveRiskLevel, string> = {
  Low: "#34d399",
  Medium: "#fbbf24",
  High: "#fb923c",
  Critical: "#f87171",
};
