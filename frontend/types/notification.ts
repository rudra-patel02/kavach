export type NotificationSeverity = "Critical" | "High" | "Medium" | "Low";

export type NotificationType =
  | "failure_probability"
  | "machine_health"
  | "temperature"
  | "vibration"
  | "pressure"
  | "power"
  | "maintenance";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  displaySeverity?: "Critical" | "Warning" | "Information";
  machineId: string;
  machineName: string;
  title: string;
  message: string;
  description?: string;
  icon: string;
  value?: number;
  threshold?: number;
  priority: "P1" | "P2" | "P3" | "P4";
  failureProbability: number;
  suggestedAction: string;
  estimatedDowntimeHours: number;
  recommendedEngineer: string;
  machineLocation: string;
  alertTimeline: {
    event: string;
    at: string;
    actor: string;
    message: string;
  }[];
  alertHistory: {
    event: string;
    at: string;
    actor: string;
    message: string;
  }[];
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
}

export interface NotificationResponse {
  success: boolean;
  notification: NotificationItem;
}

export interface NotificationBulkResponse {
  success: boolean;
  modifiedCount?: number;
  deletedCount?: number;
  unreadCount: number;
}

export interface NotificationDeleteResponse {
  success: boolean;
  deletedId: string;
}
