export type NotificationSeverity = "Critical" | "High" | "Medium" | "Low";

export type NotificationType =
  | "failure_probability"
  | "machine_health"
  | "temperature"
  | "vibration"
  | "maintenance";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  machineId: string;
  machineName: string;
  title: string;
  message: string;
  icon: string;
  value?: number;
  threshold?: number;
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
