export interface TenantEntity {
  _id: string;
  name: string;
  organizationId?: string;
  plantId?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface TenantOverview {
  departments: TenantEntity[];
  machineGroups: TenantEntity[];
  machines: TenantEntity[];
  organizations: TenantEntity[];
  plants: TenantEntity[];
  productionLines: TenantEntity[];
  stats: Record<string, number>;
  users: TenantEntity[];
}

export interface TenantOverviewResponse {
  success: boolean;
  overview: TenantOverview;
}

export interface AuditLog {
  id: string;
  action: string;
  createdAt: string | null;
  ip: string;
  metadata: Record<string, unknown>;
  newValue: unknown;
  oldValue: unknown;
  plantId: string;
  requestId: string;
  resourceId: string;
  resourceType: string;
  role: string;
  userEmail: string;
  userId: string;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
}

export interface SystemHealthResponse {
  success: boolean;
  timestamp: string;
  system: {
    api: {
      averageLatencyMs: number;
      errorRate: number;
      requests: number;
      routes: {
        averageLatencyMs: number;
        count: number;
        errors: number;
        route: string;
      }[];
    };
    cpu: {
      cores: number;
      loadAverage: number[];
      usagePercent: number;
    };
    database: {
      host?: string;
      name?: string;
      state: string;
    };
    memory: {
      freeSystemMb: number;
      heapUsedMb: number;
      rssMb: number;
      totalSystemMb: number;
    };
    mqtt: {
      brokerUrl?: string;
      clientId?: string;
      connected: boolean;
      started: boolean;
    };
    socket: {
      connections: number;
    };
    uptimeSeconds: number;
  };
}

export interface BackupConfigurationResponse {
  success: boolean;
  exportedAt: string;
  configuration: Record<string, unknown>;
}
