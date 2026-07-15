import type { AIMachineSummary } from "@/types/ai";

export type MachineStatus =
  | "Running"
  | "Warning"
  | "Critical"
  | "Offline"
  | "Idle"
  | "Maintenance";

export interface MachinePrediction {
  failureRisk: string;
  maintenancePriority: string;
  maintenanceInDays: number;
  recommendation?: string;
  recommendedAction?: string;
  riskLevel?: string;
  confidencePercent?: number;
  failureProbability?: number;
  remainingUsefulLifeHours?: number;
}

export interface MachineDisplayData {
  name?: string;
  status?: MachineStatus;
  health?: number;
  temperature?: number;
  aiPrediction?: MachinePrediction;
  aiIntelligence?: AIMachineSummary | MachineData["aiIntelligence"];
  aiFailureProbability?: number;
  aiRemainingUsefulLifeHours?: number;
  aiRootCauseSummary?: string;
  aiAnomalySeverity?: "Low" | "Medium" | "High" | "Critical";
}

export interface MachineData {
  _id: string;
  machineId: string;
  name: string;
  department: string;
  status: MachineStatus;
  health: number;
  temperature: number;
  vibration: number;
  power: number;
  current?: number;
  voltage?: number;
  efficiency: number;
  rpm?: number;
  humidity?: number;
  pressure?: number;
  oilLevel?: number;
  noise?: number;
  flowRate?: number;
  gasSensor?: number;
  energyConsumed?: number;
  downtime?: number;
  oee?: number;
  remainingUsefulLifeHours?: number;
  predictedFailureProbability?: number;
  aiHealthPercent?: number;
  aiRiskPercent?: number;
  aiFailureProbability?: number;
  aiRemainingUsefulLifeHours?: number;
  aiRootCauseSummary?: string;
  aiAnomalySeverity?: "Low" | "Medium" | "High" | "Critical";
  aiConfidencePercent?: number;
  aiLastAnalyzedAt?: string;
  aiIntelligence?: {
    generatedAt?: string | null;
    anomaly?: {
      detected?: boolean;
      severity?: "Low" | "Medium" | "High" | "Critical";
      confidence?: number;
      severityScore?: number;
      reason?: string;
    };
    healthPercent?: number;
    riskPercent?: number;
    confidencePercent?: number;
    remainingUsefulLifeHours?: number;
    remainingUsefulLifeDays?: number;
    failureProbability?: number;
    rootCauseSummary?: string;
    topRootCauses?: unknown[];
    forecast?: unknown;
    maintenancePlan?: unknown;
    recommendations?: unknown[];
  };
  telemetrySource?: "simulator" | "iot" | "manual";
  liveTelemetryEnabled?: boolean;
  linkedDeviceId?: string;
  lastLiveTelemetryAt?: string;
  lastHeartbeat?: string;
  lastSeen?: string | null;
  connectionStatus?: "online" | "offline" | "unknown";
  aiPrediction?: MachinePrediction;
  maintenanceHistory?: {
    workOrderId?: string;
    status?: string;
    completedAt?: string;
    summary?: string;
    engineer?: string;
    notes?: string;
  }[];
}
