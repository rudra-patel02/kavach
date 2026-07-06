export type AISeverity = "Low" | "Medium" | "High" | "Critical";
export type AIMaintenancePriority = "Immediate" | "High" | "Planned" | "Monitor";

export interface AIRecommendation {
  recommendation: string;
  confidence: number;
  priority: string;
  rationale: string;
  expectedImpact: string;
  machineId?: string;
  machineName?: string;
}

export interface AIRootCauseItem {
  cause: string;
  probability: number;
  explanation: string;
  correctiveActions: string[];
  evidence: string[];
}

export interface AIFailureProbabilities {
  motorFailure: number;
  bearingFailure: number;
  pumpFailure: number;
  hydraulicFailure: number;
  electricalFailure: number;
  coolingFailure: number;
}

export interface AIForecastHorizon {
  horizon: string;
  key: string;
  multiplier: number;
  probabilities: AIFailureProbabilities;
}

export interface AIForecastChartPoint extends AIFailureProbabilities {
  horizon: string;
}

export interface AIMaintenancePlan {
  priority?: AIMaintenancePriority;
  estimatedDowntimeHours?: number;
  estimatedCost?: number;
  requiredTechnicians?: string[];
  requiredSpareParts?: string[];
  estimatedCompletionTime?: string;
  calendarRecommendations?: {
    date: string;
    title: string;
    priority: string;
    durationHours: number;
  }[];
  actions?: string[];
  summary?: string;
}

export interface AIMachineSummary {
  generatedAt: string | null;
  machine: {
    machineId: string;
    name: string;
    department: string;
    status: string;
  };
  anomaly: {
    detected: boolean;
    severity: AISeverity;
    confidence: number;
    severityScore: number;
    reason: string;
  };
  healthPercent: number;
  riskPercent: number;
  confidencePercent: number;
  remainingUsefulLifeHours: number;
  remainingUsefulLifeDays: number;
  failureProbability: number;
  rootCauseSummary: string;
  topRootCauses: AIRootCauseItem[];
  forecast: {
    confidence: number;
    peakProbability: number;
    horizons: AIForecastHorizon[];
    probabilityChart: AIForecastChartPoint[];
  };
  maintenancePlan: AIMaintenancePlan;
  recommendations: AIRecommendation[];
}

export interface AIFleetSummary {
  totalMachines: number;
  averageHealth: number;
  averageRisk: number;
  highRiskMachines: number;
  criticalMachines: number;
  riskDistribution: Record<AISeverity, number>;
}

export interface AIOverview {
  generatedAt: string;
  aiEngineVersion: string;
  summary: AIFleetSummary;
  fleetHealth: AIFleetSummary;
  machines: AIMachineSummary[];
  recommendations: AIRecommendation[];
  executiveInsights: {
    title: string;
    value: string | number;
    narrative: string;
    confidence: number;
  }[];
}

export interface AITrendPoint {
  time: string;
  health: number;
  risk: number;
  failureProbability: number;
  remainingUsefulLifeHours: number;
  anomalySeverity: AISeverity;
}

export interface AIMachineIntelligence {
  generatedAt: string;
  aiEngineVersion: string;
  current: AIMachineSummary;
  latest: {
    anomaly?: unknown;
    rootCause?: {
      causes?: AIRootCauseItem[];
      summary?: string;
      confidence?: number;
    } | null;
    forecast?: {
      probabilityChart?: AIForecastChartPoint[];
      horizons?: AIForecastHorizon[];
      peakProbability?: number;
      confidence?: number;
    } | null;
    prediction?: unknown;
    maintenancePlan?: AIMaintenancePlan | null;
  };
  trends: AITrendPoint[];
}

export interface AIOverviewResponse {
  success: boolean;
  overview: AIOverview;
}

export interface AIMachineResponse {
  success: boolean;
  intelligence: AIMachineIntelligence;
}

export interface AIHistoryResponse {
  success: boolean;
  history: {
    page: number;
    limit: number;
    total: number;
    items: {
      _id: string;
      machineId: string;
      machineName: string;
      eventType: string;
      severity: AISeverity;
      summary: string;
      payload: unknown;
      timestamp: string;
    }[];
  };
}

export interface AIFleetHealthResponse {
  success: boolean;
  fleetHealth: AIFleetSummary;
  machines: AIMachineSummary[];
}

export interface AIExecutiveInsightsResponse {
  success: boolean;
  executiveInsights: AIOverview["executiveInsights"];
  recommendations: AIRecommendation[];
}
