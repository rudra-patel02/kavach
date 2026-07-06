export interface EnterprisePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface EnterpriseListResponse<T> {
  success: boolean;
  items: T[];
  pagination: EnterprisePagination;
}

export interface EnterpriseEntity {
  _id?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface EnterprisePlantComparison {
  plantId: string;
  name: string;
  country: string;
  regionId: string;
  machineCount: number;
  criticalMachines: number;
  averageHealth: number;
  failureRate: number;
  downtimeHours: number;
  energyUsage: number;
  maintenanceCost: number;
  activeWorkOrders: number;
  criticalAlerts: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface EnterpriseAssetRisk {
  machineId: string;
  assetId: string;
  name: string;
  plantId: string;
  status: string;
  criticality: string;
  health: number;
  failureProbability: number;
  remainingUsefulLifeHours: number;
  replacementCost: number;
}

export interface EnterpriseTrendPoint {
  time: string;
  health: number;
  downtime: number;
  energy: number;
  maintenanceCost: number;
  risk: number;
}

export interface EnterpriseDashboard {
  generatedAt: string;
  scope?: {
    tenantId?: string;
    organizationId?: string;
    plantId?: string | { $in: string[] };
  };
  hierarchy: {
    organizations: number;
    regions: number;
    plants: number;
    assets: number;
    engineers: number;
  };
  kpis: {
    enterpriseHealthScore: number;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    revenueImpact: number;
    maintenanceCost: number;
    downtimeCost: number;
    downtimeHours: number;
    energyUsage: number;
    aiRisk: number;
    activeWorkOrders: number;
    criticalAlerts: number;
  };
  fleet: {
    overallFleetHealth: number;
    criticalMachines: number;
    healthRanking: EnterpriseAssetRisk[];
    failureDistribution: Record<"Low" | "Medium" | "High" | "Critical", number>;
    riskHeatmap: {
      plantId: string;
      name: string;
      x: number;
      y: number;
      z: number;
      risk: number;
    }[];
    maintenanceCost: number;
    downtimeTrend: { time: string; value: number }[];
    energyTrend: { time: string; value: number }[];
    plantComparison: EnterprisePlantComparison[];
    machineComparison: EnterpriseAssetRisk[];
  };
  crossPlantAnalytics: {
    bestPerformingPlant: EnterprisePlantComparison | null;
    worstPerformingPlant: EnterprisePlantComparison | null;
    highestDowntime: EnterprisePlantComparison | null;
    highestEnergyConsumption: EnterprisePlantComparison | null;
    highestFailureRate: EnterprisePlantComparison | null;
    lowestOee: EnterprisePlantComparison | null;
    maintenanceBenchmark: number;
    costComparison: {
      plantId: string;
      name: string;
      maintenanceCost: number;
      downtimeCost: number;
    }[];
    recommendations: string[];
  };
  trends: EnterpriseTrendPoint[];
  topFailingAssets: EnterpriseAssetRisk[];
  plantComparison: EnterprisePlantComparison[];
  recentAlerts: EnterpriseEntity[];
  recentWorkOrders: EnterpriseEntity[];
  engineers: EnterpriseEntity[];
}

export interface EnterpriseDashboardResponse {
  success: boolean;
  dashboard: EnterpriseDashboard;
}

export interface EnterpriseFleetResponse {
  success: boolean;
  fleet: EnterpriseDashboard["fleet"];
}

export interface EnterpriseAnalyticsResponse {
  success: boolean;
  analytics: EnterpriseDashboard["crossPlantAnalytics"];
  plantComparison: EnterprisePlantComparison[];
}
