"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Gauge,
  HeartPulse,
  Inbox,
  Loader2,
  Thermometer,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import {
  clearNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import socket from "@/lib/socket";
import type {
  NotificationItem,
  NotificationSeverity,
} from "@/types/notification";

const severityClasses: Record<NotificationSeverity, string> = {
  Critical: "border-red-400/40 bg-red-500/15 text-red-200",
  High: "border-orange-400/40 bg-orange-500/15 text-orange-200",
  Medium: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  Low: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
};

const iconClasses: Record<NotificationSeverity, string> = {
  Critical: "bg-red-500/15 text-red-300 ring-red-400/20",
  High: "bg-orange-500/15 text-orange-300 ring-orange-400/20",
  Medium: "bg-amber-500/15 text-amber-200 ring-amber-400/20",
  Low: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
};

const iconMap = {
  activity: Activity,
  "heart-pulse": HeartPulse,
  thermometer: Thermometer,
  gauge: Gauge,
  wrench: Wrench,
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));

type NotificationReadPayload = {
  id: string;
  notification?: NotificationItem;
};

type NotificationDeletedPayload = {
  id: string;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetchNotifications();
      setNotifications(response.notifications);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleNewNotification = (notification: NotificationItem) => {
      setNotifications((currentNotifications) => {
        if (
          currentNotifications.some(
            (currentNotification) => currentNotification.id === notification.id
          )
        ) {
          return currentNotifications;
        }

        return [notification, ...currentNotifications].slice(0, 100);
      });
    };

    const handleNotificationRead = (payload: NotificationReadPayload) => {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => {
          if (notification.id !== payload.id) {
            return notification;
          }

          return (
            payload.notification || {
              ...notification,
              read: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          );
        })
      );
    };

    const handleAllNotificationsRead = () => {
      const readAt = new Date().toISOString();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          read: true,
          readAt: notification.readAt || readAt,
        }))
      );
    };

    const handleNotificationDeleted = (payload: NotificationDeletedPayload) => {
      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== payload.id
        )
      );
    };

    const handleNotificationsCleared = () => {
      setNotifications([]);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notifications:readAll", handleAllNotificationsRead);
    socket.on("notification:deleted", handleNotificationDeleted);
    socket.on("notifications:cleared", handleNotificationsCleared);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notifications:readAll", handleAllNotificationsRead);
      socket.off("notification:deleted", handleNotificationDeleted);
      socket.off("notifications:cleared", handleNotificationsCleared);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const setNotificationPending = (id: string, isPending: boolean) => {
    setPendingIds((currentPendingIds) => {
      const nextPendingIds = new Set(currentPendingIds);

      if (isPending) {
        nextPendingIds.add(id);
      } else {
        nextPendingIds.delete(id);
      }

      return nextPendingIds;
    });
  };

  const handleMarkRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);

    if (!notification || notification.read) {
      return;
    }

    setNotificationPending(id, true);
    setNotifications((currentNotifications) =>
      currentNotifications.map((currentNotification) =>
        currentNotification.id === id
          ? {
              ...currentNotification,
              read: true,
              readAt: new Date().toISOString(),
            }
          : currentNotification
      )
    );

    try {
      const response = await markNotificationRead(id);
      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === id
            ? response.notification
            : currentNotification
        )
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to mark notification as read"
      );
      void loadNotifications();
    } finally {
      setNotificationPending(id, false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setIsMarkingAll(true);
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true,
        readAt: notification.readAt || readAt,
      }))
    );

    try {
      await markAllNotificationsRead();
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to mark all notifications as read"
      );
      void loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const previousNotifications = notifications;
    setNotificationPending(id, true);
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== id)
    );

    try {
      await deleteNotification(id);
      setError(null);
    } catch (requestError) {
      setNotifications(previousNotifications);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete notification"
      );
    } finally {
      setNotificationPending(id, false);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) {
      return;
    }

    const previousNotifications = notifications;
    setIsClearing(true);
    setNotifications([]);

    try {
      await clearNotifications();
      setError(null);
    } catch (requestError) {
      setNotifications(previousNotifications);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to clear notifications"
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200"
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-slate-950 bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="notification-panel-enter fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40 sm:absolute sm:right-0 sm:top-14 sm:w-[440px]">
          <div className="border-b border-slate-800 bg-slate-900/95 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Notifications
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Real-time alerts
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {unreadCount} unread from {notifications.length} total
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || isMarkingAll}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isMarkingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCheck size={16} />
                )}
                Mark all read
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={notifications.length === 0 || isClearing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isClearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Clear all
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex min-h-52 items-center justify-center text-slate-300">
                <div className="text-center">
                  <Loader2
                    className="mx-auto animate-spin text-cyan-300"
                    size={32}
                  />
                  <p className="mt-3 text-sm font-semibold">
                    Loading notifications
                  </p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                    <Inbox size={24} />
                  </div>
                  <p className="mt-4 font-semibold text-white">
                    No notifications
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    All monitored machines are quiet right now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon =
                    iconMap[notification.icon as keyof typeof iconMap] ||
                    AlertTriangle;
                  const isPending = pendingIds.has(notification.id);

                  return (
                    <article
                      key={notification.id}
                      className={`notification-item-enter rounded-xl border p-4 transition-all duration-200 hover:border-slate-600 ${
                        notification.read
                          ? "border-slate-800 bg-slate-900/75"
                          : "border-cyan-400/25 bg-cyan-500/10 shadow-lg shadow-cyan-950/20"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                            iconClasses[notification.severity]
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                                severityClasses[notification.severity]
                              }`}
                            >
                              {notification.severity}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                notification.read
                                  ? "bg-slate-800 text-slate-400"
                                  : "bg-cyan-400/15 text-cyan-200"
                              }`}
                            >
                              {notification.read ? "Read" : "Unread"}
                            </span>
                          </div>

                          <h4 className="mt-2 text-sm font-bold text-white">
                            {notification.machineName}
                          </h4>
                          <p className="mt-1 text-sm text-slate-300">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => void handleMarkRead(notification.id)}
                            disabled={notification.read || isPending}
                            title="Mark as read"
                            aria-label="Mark notification as read"
                            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            {isPending && !notification.read ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Check size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteNotification(notification.id)
                            }
                            disabled={isPending}
                            title="Delete notification"
                            aria-label="Delete notification"
                            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            {isPending ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {error ? (
              <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
