import type { PredictiveMachine, PredictiveRecommendation } from "./predictive";

export type ExecutiveMetricStatus = "good" | "warning" | "critical" | "neutral";

export type ExecutiveMetricTrend = "up" | "down" | "flat";

export type ExecutiveMetricKey =
  | "availability"
  | "oee"
  | "health"
  | "energy"
  | "temperature"
  | "downtime"
  | "risk"
  | "alerts"
  | "criticalMachines"
  | "runningMachines"
  | "maintenanceMachines"
  | "idleMachines";

export interface ExecutiveDepartmentPerformance {
  department: string;
  machines: number;
  running: number;
  warnings: number;
  critical: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  energy: number;
  failureProbability: number;
  activeWorkOrders: number;
  downtime: number;
}

export interface ExecutiveTrendPoint {
  time: string;
  value: number;
}

export interface PlantKPI {
  availability: number;
  oee: number;
  health: number;
  temperature: number;
  vibration: number;
  energy: number;
  risk: number;
  alerts: number;
  downtime: number;
  safetyScore: number;
  efficiency: number;
}

export interface MachineSummary {
  totalMachines: number;
  runningMachines: number;
  idleMachines: number;
  maintenanceMachines: number;
  criticalMachines: number;
  warningMachines: number;
  offlineMachines: number;
}

export interface ExecutiveMetric {
  key: ExecutiveMetricKey;
  label: string;
  value: number;
  unit: string;
  status: ExecutiveMetricStatus;
  trend: ExecutiveMetricTrend;
  trendValue: number;
  sparkline: ExecutiveTrendPoint[];
}

export interface ExecutiveDashboard {
  generatedAt: string;
  source: string;
  kpis: {
    availability: number;
    oee: number;
    health: number;
    temperature: number;
    vibration: number;
    energy: number;
    risk: number;
    alerts: number;
    safetyScore: number;
    efficiency: number;
    mtbf: number;
    mttr: number;
    downtime: number;
    performance: number;
    quality: number;
    averageHealth: number;
    averageMachineHealth: number;
    averageTemperature: number;
    averageVibration: number;
    averageEnergyConsumption: number;
    productionEfficiency: number;
    overallOeeScore: number;
    estimatedDowntimeToday: number;
    activeAlertsCount: number;
    averageAiFailureRisk: number;
    plantSafetyScore: number;
    energyCost: number;
    carbonEmissionKg: number;
    productionRate: number;
    machineUtilization: number;
    totalEnergy: number;
    totalMachines: number;
    running: number;
    idle: number;
    maintenance: number;
    warning: number;
    critical: number;
    offline: number;
    activeWorkOrders: number;
    criticalAlerts: number;
    runningMachines: number;
    idleMachines: number;
    maintenanceMachines: number;
    criticalMachines: number;
  };
  plantKpis: PlantKPI;
  machineSummary: MachineSummary;
  metrics?: ExecutiveMetric[];
  statusDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  departmentPerformance: ExecutiveDepartmentPerformance[];
  trends: {
    oee: ExecutiveTrendPoint[];
    downtime: ExecutiveTrendPoint[];
    energy: ExecutiveTrendPoint[];
    failureProbability: ExecutiveTrendPoint[];
    production: ExecutiveTrendPoint[];
  };
  topRiskMachines: PredictiveMachine[];
  recommendations: PredictiveRecommendation[];
}

export interface ExecutiveDashboardResponse {
  success: boolean;
  dashboard: ExecutiveDashboard;
  availability: number;
  oee: number;
  health: number;
  temperature: number;
  vibration: number;
  energy: number;
  risk: number;
  alerts: number;
  downtime: number;
  safetyScore: number;
  efficiency: number;
  totalMachines: number;
  runningMachines: number;
  idleMachines: number;
  maintenanceMachines: number;
  criticalMachines: number;
  warningMachines: number;
  offlineMachines: number;
}
