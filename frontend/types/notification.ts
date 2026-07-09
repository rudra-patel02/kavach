export type NotificationSeverity = "Critical" | "High" | "Medium" | "Low";

export type NotificationType =
  | "critical_alert"
  | "failure_probability"
  | "machine_failure"
  | "machine_health"
  | "maintenance_due"
  | "ai_recommendation"
  | "production_delay"
  | "energy_spike"
  | "safety_warning"
  | "quality_issue"
  | "inventory_alert"
  | "temperature"
  | "vibration"
  | "pressure"
  | "power"
  | "maintenance";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category?: string;
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
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  unreadCount: number;
  nextCursor?: string | null;
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

export interface NotificationPreferences {
  categories: NotificationType[];
  criticalAlerts: boolean;
  desktop: boolean;
  email: boolean;
  push: boolean;
  sound: boolean;
  weeklyReports: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  preferences: NotificationPreferences;
}

export interface NotificationCreatePayload {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  machineId?: string;
  machineName?: string;
  priority?: "P1" | "P2" | "P3" | "P4";
  suggestedAction?: string;
}
