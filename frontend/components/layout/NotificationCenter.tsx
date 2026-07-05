"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Gauge,
  HeartPulse,
  Inbox,
  Loader2,
  Search,
  Thermometer,
  Trash2,
  Wrench,
  X,
  Zap,
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
  NotificationType,
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
  zap: Zap,
  "heart-pulse": HeartPulse,
  thermometer: Thermometer,
  gauge: Gauge,
  wrench: Wrench,
};

const categoryLabels: Record<NotificationType, string> = {
  failure_probability: "Failure probability",
  machine_health: "Machine health",
  maintenance: "Maintenance",
  power: "Power",
  pressure: "Pressure",
  temperature: "Temperature",
  vibration: "Vibration",
};

const notificationTypes = Object.keys(categoryLabels) as NotificationType[];
const severities: NotificationSeverity[] = ["Critical", "High", "Medium", "Low"];

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

type NotificationSocketPayload =
  | NotificationItem
  | { notification?: NotificationItem };

type DesktopPermission = NotificationPermission | "unsupported";

const isWrappedNotificationPayload = (
  payload: NotificationSocketPayload
): payload is { notification?: NotificationItem } =>
  Object.prototype.hasOwnProperty.call(payload, "notification");

const getSocketNotification = (payload: NotificationSocketPayload) =>
  isWrappedNotificationPayload(payload) ? payload.notification : payload;

const getDesktopPermission = (): DesktopPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    NotificationSeverity | "all"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<NotificationType | "all">(
    "all"
  );
  const [toastNotification, setToastNotification] =
    useState<NotificationItem | null>(null);
  const [desktopPermission, setDesktopPermission] =
    useState<DesktopPermission>("unsupported");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const liveToastIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSeverity =
        severityFilter === "all" || notification.severity === severityFilter;
      const matchesCategory =
        categoryFilter === "all" || notification.type === categoryFilter;
      const searchable = [
        notification.machineId,
        notification.machineName,
        notification.message,
        notification.priority,
        notification.severity,
        notification.title,
        notification.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesSeverity &&
        matchesCategory &&
        (!query || searchable.includes(query))
      );
    });
  }, [categoryFilter, notifications, searchTerm, severityFilter]);

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

  const showRealtimeNotification = useCallback(
    (notification: NotificationItem) => {
      if (liveToastIdsRef.current.has(notification.id)) {
        return;
      }

      liveToastIdsRef.current.add(notification.id);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      setToastNotification(notification);
      toastTimerRef.current = window.setTimeout(() => {
        setToastNotification(null);
      }, 5000);

      if (desktopPermission === "granted" && "Notification" in window) {
        new window.Notification(notification.title, {
          body: notification.message,
          tag: notification.id,
        });
      }
    },
    [desktopPermission]
  );

  useEffect(() => {
    const permissionTimer = window.setTimeout(() => {
      setDesktopPermission(getDesktopPermission());
    }, 0);

    return () => {
      window.clearTimeout(permissionTimer);
    };
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadNotifications]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const handleNewNotification = (payload: NotificationSocketPayload) => {
      const notification = getSocketNotification(payload);

      if (!notification?.id) {
        return;
      }

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
      showRealtimeNotification(notification);
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
    socket.on("notification:created", handleNewNotification);
    socket.on("alert:created", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notifications:readAll", handleAllNotificationsRead);
    socket.on("notification:deleted", handleNotificationDeleted);
    socket.on("notifications:cleared", handleNotificationsCleared);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:created", handleNewNotification);
      socket.off("alert:created", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notifications:readAll", handleAllNotificationsRead);
      socket.off("notification:deleted", handleNotificationDeleted);
      socket.off("notifications:cleared", handleNotificationsCleared);
    };
  }, [showRealtimeNotification]);

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

  const handleRequestDesktopNotifications = async () => {
    if (!("Notification" in window)) {
      setDesktopPermission("unsupported");
      setError("Desktop notifications are not supported by this browser");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setDesktopPermission(permission);
      setError(null);
    } catch {
      setError("Could not update desktop notification permission");
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {toastNotification ? (
        <div className="fixed right-4 top-20 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                iconClasses[toastNotification.severity]
              }`}
            >
              <BellRing size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                {toastNotification.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {toastNotification.message}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
                  {filteredNotifications.length !== notifications.length
                    ? `, ${filteredNotifications.length} shown`
                    : ""}
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

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || isMarkingAll}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isClearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Clear all
              </button>

              <button
                type="button"
                onClick={() => void handleRequestDesktopNotifications()}
                disabled={desktopPermission === "unsupported"}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <BellRing size={16} />
                {desktopPermission === "granted" ? "Desktop on" : "Desktop"}
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus-within:border-cyan-400/50">
                <Search size={16} className="shrink-0 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search machine, title, priority..."
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(
                      event.target.value as NotificationSeverity | "all"
                    )
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/50"
                  aria-label="Filter notifications by severity"
                >
                  <option value="all">All severities</option>
                  {severities.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value as NotificationType | "all")
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/50"
                  aria-label="Filter notifications by category"
                >
                  <option value="all">All categories</option>
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {categoryLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
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
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300 ring-1 ring-slate-700">
                    <Search size={24} />
                  </div>
                  <p className="mt-4 font-semibold text-white">
                    No matching notifications
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Adjust filters or search another machine.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
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
                            {notification.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-300">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{notification.machineName}</span>
                            <span>{categoryLabels[notification.type]}</span>
                            <span>{notification.priority}</span>
                            <span>{formatTimestamp(notification.createdAt)}</span>
                          </div>
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
