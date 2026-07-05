export type WorkOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "COMPLETED"
  | "CANCELLED";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type WorkOrderSeverity = "Critical" | "High" | "Medium" | "Low";

export interface WorkOrderNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface WorkOrderAttachment {
  id: string;
  name: string;
  url: string;
  type?: string;
  uploadedAt: string;
}

export interface WorkOrderHistoryItem {
  event: string;
  from?: string;
  to?: string;
  actor: string;
  message?: string;
  at: string;
}

export interface WorkOrderNotificationHistoryItem {
  notificationId: string;
  severity: WorkOrderSeverity;
  title: string;
  message: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  workOrderId: string;
  machineId: string;
  machineName: string;
  department: string;
  priority: WorkOrderPriority;
  severity: WorkOrderSeverity;
  status: WorkOrderStatus;
  assignedEngineer: string;
  description: string;
  probableCause: string;
  aiRecommendation: string;
  estimatedDowntimeHours: number;
  estimatedRepairCost: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  notes: WorkOrderNote[];
  attachments: WorkOrderAttachment[];
  history: WorkOrderHistoryItem[];
  notificationHistory: WorkOrderNotificationHistoryItem[];
}

export interface WorkOrdersResponse {
  success: boolean;
  workOrders: WorkOrder[];
}

export interface WorkOrderStats {
  pending: number;
  active: number;
  completed: number;
  overdue: number;
  highPriority: number;
  estimatedDurationHours: number;
  byStatus: Partial<Record<WorkOrderStatus, number>>;
  byPriority: Partial<Record<WorkOrderPriority, number>>;
}

export interface WorkOrderStatsResponse {
  success: boolean;
  stats: WorkOrderStats;
}

export interface WorkOrderResponse {
  success: boolean;
  workOrder: WorkOrder;
}

export interface WorkOrderDeleteResponse {
  success: boolean;
  deletedWorkOrder: {
    id: string;
    workOrderId: string;
  };
}

export interface WorkOrderUpdatePayload {
  priority?: WorkOrderPriority;
  severity?: WorkOrderSeverity;
  status?: WorkOrderStatus;
  assignedEngineer?: string;
  description?: string;
  probableCause?: string;
  aiRecommendation?: string;
  department?: string;
  estimatedDowntimeHours?: number;
  estimatedRepairCost?: number;
  dueDate?: string | null;
  note?: string;
  author?: string;
}
