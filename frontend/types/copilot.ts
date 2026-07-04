import type { MachinePrediction } from "@/types/machine";

export type CopilotRiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface CopilotIssue {
  key: string;
  severity: CopilotRiskLevel;
  message: string;
}

export interface CopilotRecommendation {
  possibleCause: string;
  riskLevel: CopilotRiskLevel;
  recommendedAction: string;
  priority: string;
  estimatedDowntime: string;
}

export interface CopilotMachineInsight extends CopilotRecommendation {
  machineId: string;
  name: string;
  department: string;
  status: string;
  health: number;
  temperature: number;
  vibration: number;
  pressure: number;
  power: number;
  energy: number;
  efficiency: number;
  aiPrediction: MachinePrediction | null;
  issues: CopilotIssue[];
}

export interface CopilotPlantSummary {
  totalMachines: number;
  healthyMachines: number;
  warningMachines: number;
  criticalMachines: number;
  averageHealth: number;
  highestTemperature: {
    machineId: string;
    name: string;
    value: number;
    unit: string;
  } | null;
  highestEnergyConsumption: {
    machineId: string;
    name: string;
    value: number;
    unit: string;
  } | null;
  topRiskMachine: {
    machineId: string;
    name: string;
    riskLevel: CopilotRiskLevel;
    priority: string;
  } | null;
}

export interface CopilotChatResponse {
  success: boolean;
  message: string;
  intent: string;
  answer: string;
  recommendation: CopilotRecommendation;
  summary: CopilotPlantSummary;
  affectedMachines: CopilotMachineInsight[];
  suggestedQuestions?: string[];
  generatedAt: string;
}

export interface CopilotReport {
  reportId: string;
  title: string;
  generatedAt: string;
  plantSummary: CopilotPlantSummary;
  riskDistribution: Record<CopilotRiskLevel, number>;
  criticalAlerts: {
    machineId: string;
    name: string;
    riskLevel: CopilotRiskLevel;
    issue: string;
    recommendedAction: string;
    priority: string;
  }[];
  maintenanceSchedule: {
    machineId: string;
    name: string;
    priority: string;
    riskLevel: CopilotRiskLevel;
    estimatedDowntime: string;
    recommendedAction: string;
    dueInDays: number;
  }[];
  machines: CopilotMachineInsight[];
}

export interface CopilotReportResponse {
  success: boolean;
  report: CopilotReport;
}
