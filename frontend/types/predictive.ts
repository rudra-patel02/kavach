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
  humidity?: number;
  power?: number;
  current?: number;
  voltage?: number;
  oilLevel?: number;
  noise?: number;
  flowRate?: number;
  gasSensor?: number;
  efficiency?: number;
  oee?: number;
  energy: number;
  health: number;
}

export interface PredictionTimelinePoint {
  time: string;
  failureProbability: number;
  riskScore: number;
  health: number;
  confidence: number;
}

export interface PredictiveMachine {
  machineId: string;
  name: string;
  department: string;
  status: string;
  machineHealth: number;
  failureProbability: number;
  failureProbabilityPercent: number;
  riskScore: number;
  remainingUsefulLifeHours: number;
  aiConfidence: number;
  confidencePercent: number;
  confidenceScore: number;
  riskLevel: PredictiveRiskLevel;
  maintenancePriority: string;
  maintenanceUrgency: string;
  trendDirection: string;
  riskTrend: string;
  probableCause: string;
  rootCause: string;
  businessImpact?: string;
  recommendation: string;
  recommendedAction: string;
  rootCauseAnalysis?: {
    probableRootCause: string;
    probableCause: string;
    confidencePercent: number;
    confidence: number;
    businessImpact: string;
    recommendedAction: string;
    maintenancePriority: string;
    riskLevel: PredictiveRiskLevel;
    failureProbability: number;
    generatedAt: string;
  };
  recommendationEngine: {
    recommendedAction: string;
    probableCause: string;
    priority: string;
    riskLevel: PredictiveRiskLevel;
  };
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
  predictionTimeline: PredictionTimelinePoint[];
  healthTrend: PredictiveTrendPoint[];
  predictionHistory: {
    timestamp: string;
    failureProbability: number;
    remainingUsefulLifeHours: number;
    maintenancePriority: string;
    riskLevel: PredictiveRiskLevel;
    confidenceScore: number;
  }[];
  historicalTrend: {
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
  businessImpact?: string;
  recommendedAction?: string;
  maintenancePriority?: string;
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
    riskScore: number;
    remainingUsefulLifeHours: number;
    aiConfidence: number;
    riskLevel: PredictiveRiskLevel;
    maintenancePriority: string;
    maintenanceUrgency: string;
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
  predictionTimeline: PredictionTimelinePoint[];
  predictions: PredictiveMachine[];
  ranking: PredictiveRankingRow[];
  maintenanceCalendar: PredictiveCalendarItem[];
  recommendations: PredictiveRecommendation[];
}

export interface PredictiveOverviewResponse {
  success: boolean;
  overview: PredictiveOverview;
}

export interface PredictiveMachineDetailResponse {
  success: boolean;
  detail: {
    generatedAt: string;
    source: string;
    machine: {
      machineId: string;
      name: string;
      department: string;
      status: string;
      lastHeartbeat: string | null;
    };
    prediction: PredictiveMachine;
    predictionHistory: PredictiveMachine["predictionHistory"];
    historicalTrend: PredictiveMachine["historicalTrend"];
  };
}

export interface PredictiveSimulationResponse {
  success: boolean;
  simulation: {
    generatedAt: string;
    scenario: {
      name: string;
      eventType?: string;
      overrides: Record<string, number | string>;
      assumptions: string[];
    };
    machine: {
      machineId: string;
      name: string;
      status: string;
    };
    baseline: PredictiveMachine;
    simulated: PredictiveMachine;
    impact: {
      riskDelta: number;
      remainingUsefulLifeHoursDelta: number;
      downtimeDeltaHours: number;
      affectedMachines?: {
        machineId: string;
        name: string;
        department: string;
        riskLevel: PredictiveRiskLevel;
      }[];
      downtimeHours?: number;
      financialImpact?: number;
      operationalImpact?: string;
      riskLevel?: PredictiveRiskLevel;
      recommendedActions?: string[];
      recommendation: string;
    };
  };
}
