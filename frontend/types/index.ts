// Shared domain types for the in-scope KAVACH UI (Parts 1–4 backend contract).

export type Role = "Manager" | "Engineer" | "Viewer";

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: Role | string;
}

export type MachineStatus = "Running" | "Warning" | "Critical" | "Offline";

export interface Threshold {
  metric: string;
  unit?: string;
  warnMin?: number;
  warnMax?: number;
  critMin?: number;
  critMax?: number;
}

export interface Machine {
  id: string;
  machineId: string;
  name: string;
  location?: string;
  status: MachineStatus;
  healthScore: number;
  ratedThroughput?: number;
  thresholds?: Threshold[];
  lastReadingAt?: string;
  lastReadingSource?: "device" | "sim";
}

export interface Reading {
  _id?: string;
  machineId: string;
  metric: string;
  value: number;
  unit?: string;
  ts: string;
  source?: "device" | "sim";
}

// A per-machine KPI row from /api/kpis. Fractions are 0..1 or null when the
// underlying data is incomplete (never fabricated).
export interface MachineKpi {
  machineId: string;
  name?: string;
  status?: MachineStatus;
  availability: number;
  performance: number | null;
  quality: number | null;
  oee: number | null;
  dataComplete: boolean;
  mtbfHours: number;
  mttrHours: number;
  failures: number;
}

export interface PlantKpi {
  machineCount: number;
  availability: number;
  performance: number | null;
  quality: number | null;
  oee: number | null;
  dataComplete: boolean;
  mtbfHours: number;
  mttrHours: number;
  failures: number;
}

export interface KpiResponse {
  success: boolean;
  window: { from: string; to: string };
  plant: PlantKpi;
  machines: MachineKpi[];
}

export type AlertSeverity = "Warning" | "Critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  machineId: string;
  metric: string;
  breachValue: number;
  threshold?: number;
  severity: AlertSeverity;
  status: AlertStatus;
  ts: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export type WorkOrderStatus = "Open" | "Assigned" | "In Progress" | "Resolved";
export type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";

export interface WorkOrder {
  id: string;
  machineId: string;
  title: string;
  description?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assigneeId?: string;
  createdBy?: string;
  linkedAlertId?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  status?: string;
}
