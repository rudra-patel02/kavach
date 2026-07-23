import { fetchJson } from "./api";
import type {
  NotificationBulkResponse,
  NotificationCreatePayload,
  NotificationDeleteResponse,
  NotificationPreferencesResponse,
  NotificationResponse,
  NotificationsResponse,
} from "@/types/notification";

export const fetchNotifications = (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJson<NotificationsResponse>(
    `/api/notifications${query ? `?${query}` : ""}`
  );
};

export const createNotification = (payload: NotificationCreatePayload) =>
  fetchJson<NotificationResponse>("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const markNotificationRead = (id: string) =>
  fetchJson<NotificationResponse>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
    }
  );

export const archiveNotification = (id: string, archived = true) =>
  fetchJson<NotificationResponse>(
    `/api/notifications/${encodeURIComponent(id)}/archive`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ archived }),
    }
  );

export const archiveNotifications = (ids?: string[]) =>
  fetchJson<NotificationBulkResponse>("/api/notifications/archive", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ids ? { ids } : {}),
  });

export const fetchNotificationPreferences = () =>
  fetchJson<NotificationPreferencesResponse>("/api/notifications/preferences");

export const updateNotificationPreferences = (
  payload: Partial<NotificationPreferencesResponse["preferences"]>
) =>
  fetchJson<NotificationPreferencesResponse>("/api/notifications/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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

export const fetchPushSubscriptionStatus = () =>
  fetchJson<{
    success: boolean;
    status: {
      activeSubscriptions: number;
      configured: boolean;
      subscriptions: unknown[];
    };
  }>("/api/notifications/push/status");

export const registerPushSubscription = (subscription: PushSubscriptionJSON) =>
  fetchJson<{ success: boolean; vapidPublicKeyConfigured: boolean }>(
    "/api/notifications/push/subscribe",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription }),
    }
  );

export const unregisterPushSubscription = (endpoint: string) =>
  fetchJson<{ success: boolean; modifiedCount: number }>(
    "/api/notifications/push/unsubscribe",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint }),
    }
  );
