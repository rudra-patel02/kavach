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
  energyConsumed?: number;
  downtime?: number;
  oee?: number;
  remainingUsefulLifeHours?: number;
  predictedFailureProbability?: number;
  lastHeartbeat?: string;
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
