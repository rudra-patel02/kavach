import { fetchJson } from "./api";
import type {
  NotificationBulkResponse,
  NotificationDeleteResponse,
  NotificationResponse,
  NotificationsResponse,
} from "@/types/notification";

export const fetchNotifications = () =>
  fetchJson<NotificationsResponse>("/api/notifications");

export const markNotificationRead = (id: string) =>
  fetchJson<NotificationResponse>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
    }
  );

export const markAllNotificationsRead = () =>
  fetchJson<NotificationBulkResponse>("/api/notifications/read", {
    method: "PATCH",
  });

export const deleteNotification = (id: string) =>
  fetchJson<NotificationDeleteResponse>(
    `/api/notifications/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

export const clearNotifications = () =>
  fetchJson<NotificationBulkResponse>("/api/notifications", {
    method: "DELETE",
  });
