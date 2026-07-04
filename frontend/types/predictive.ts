import type { MachinePrediction } from "@/types/machine";

export type PredictiveRiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface PredictiveKpi {
  label: string;
  value: number;
  unit: string;
  riskLevel: PredictiveRiskLevel;
}

export interface PredictiveTrendPoint {
  time: string;
  value: number;
}

export interface PredictiveMachineTelemetry {
  temperature: number;
  vibration: number;
  pressure: number;
  energy: number;
  health: number;
}

export interface PredictiveMachine {
  machineId: string;
  name: string;
  department: string;
  status: string;
  machineHealth: number;
  failureProbability: number;
  remainingUsefulLifeHours: number;
  aiConfidence: number;
  riskLevel: PredictiveRiskLevel;
  maintenancePriority: string;
  trendDirection: string;
  probableCause: string;
  recommendation: string;
  estimatedDowntimeHours: number;
  inspectionDate: string;
  telemetry: PredictiveMachineTelemetry;
  aiPrediction: MachinePrediction | null;
  trends: {
    temperature: PredictiveTrendPoint[];
    health: PredictiveTrendPoint[];
    failureProbability: PredictiveTrendPoint[];
    energy: PredictiveTrendPoint[];
  };
}

export interface PredictiveRankingRow {
  rank: number;
  machineId: string;
  name: string;
  department: string;
  machineHealth: number;
  failureProbability: number;
  remainingUsefulLifeHours: number;
  aiConfidence: number;
  riskLevel: PredictiveRiskLevel;
  maintenancePriority: string;
}

export interface PredictiveCalendarItem {
  date: string;
  machineId: string;
  name: string;
  task: string;
  priority: string;
  riskLevel: PredictiveRiskLevel;
  estimatedDowntimeHours: number;
}

export interface PredictiveRecommendation {
  machineId: string;
  name: string;
  title: string;
  riskLevel: PredictiveRiskLevel;
  priority: string;
  probableCause: string;
  recommendation: string;
  confidence: number;
}

export interface PredictiveOverview {
  generatedAt: string;
  source: string;
  summary: {
    totalMachines: number;
    machineHealth: number;
    failureProbability: number;
    remainingUsefulLifeHours: number;
    aiConfidence: number;
    riskLevel: PredictiveRiskLevel;
    maintenancePriority: string;
    highRiskMachines: number;
    riskDistribution: Record<PredictiveRiskLevel, number>;
  };
  kpis: PredictiveKpi[];
  trends: {
    temperature: PredictiveTrendPoint[];
    health: PredictiveTrendPoint[];
    failureProbability: PredictiveTrendPoint[];
    energy: PredictiveTrendPoint[];
  };
  predictions: PredictiveMachine[];
  ranking: PredictiveRankingRow[];
  maintenanceCalendar: PredictiveCalendarItem[];
  recommendations: PredictiveRecommendation[];
}

export interface PredictiveOverviewResponse {
  success: boolean;
  overview: PredictiveOverview;
}
