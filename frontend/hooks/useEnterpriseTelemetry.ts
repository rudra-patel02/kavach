"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildEnhancedAlerts,
  buildMachineProfiles,
  calculateExecutiveKpis,
  generateAiInsights,
} from "@/lib/enterpriseAnalytics";
import { fetchMachines } from "@/lib/machines";
import { fetchNotifications } from "@/lib/notifications";
import { fetchPredictiveOverview } from "@/lib/predictive";
import socket, {
  SOCKET_EVENTS,
  joinPlantRoom,
  leavePlantRoom,
} from "@/lib/socket";
import { fetchWorkOrders } from "@/lib/workorders";
import type { MachineData } from "@/types/machine";
import type { NotificationItem } from "@/types/notification";
import type { PredictiveOverview } from "@/types/predictive";
import type { WorkOrder } from "@/types/workOrder";

const upsertById = <T extends { id: string }>(items: T[], item: T) =>
  items.some((currentItem) => currentItem.id === item.id)
    ? items.map((currentItem) =>
        currentItem.id === item.id ? item : currentItem
      )
    : [item, ...items];

const upsertMachine = (items: MachineData[], item: MachineData) =>
  items.some((currentItem) => currentItem.machineId === item.machineId)
    ? items.map((currentItem) =>
        currentItem.machineId === item.machineId ? item : currentItem
      )
    : [item, ...items];

type NotificationSocketPayload =
  | NotificationItem
  | { notification?: NotificationItem };

const isWrappedNotificationPayload = (
  payload: NotificationSocketPayload
): payload is { notification?: NotificationItem } =>
  Object.prototype.hasOwnProperty.call(payload, "notification");

export function useEnterpriseTelemetry() {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [overview, setOverview] = useState<PredictiveOverview | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const predictiveRefreshRef = useRef<number | null>(null);

  const loadTelemetry = useCallback(async () => {
    const [
      machineResult,
      predictiveResult,
      notificationResult,
      workOrderResult,
    ] = await Promise.allSettled([
      fetchMachines(),
      fetchPredictiveOverview(),
      fetchNotifications(),
      fetchWorkOrders(),
    ]);

    if (machineResult.status === "fulfilled") {
      setMachines(Array.isArray(machineResult.value) ? machineResult.value : []);
    }

    if (predictiveResult.status === "fulfilled") {
      setOverview(predictiveResult.value.overview);
    }

    if (notificationResult.status === "fulfilled") {
      setNotifications(notificationResult.value.notifications);
    }

    if (workOrderResult.status === "fulfilled") {
      setWorkOrders(workOrderResult.value.workOrders);
    }

    const failures = [
      { label: "machine telemetry", result: machineResult },
      { label: "predictive analytics", result: predictiveResult },
      { label: "notifications", result: notificationResult },
      { label: "work orders", result: workOrderResult },
    ]
      .filter(({ result }) => result.status === "rejected")
      .map(({ label }) => label);

    setError(
      failures.length
        ? `Some enterprise feeds are temporarily unavailable: ${failures.join(", ")}.`
        : null
    );
    setIsLoading(false);
  }, []);

  const refreshPredictiveOverview = useCallback(() => {
    if (predictiveRefreshRef.current) {
      window.clearTimeout(predictiveRefreshRef.current);
    }

    predictiveRefreshRef.current = window.setTimeout(() => {
      fetchPredictiveOverview()
        .then((response) => {
          setOverview(response.overview);
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to refresh predictive overview"
          );
        });
    }, 350);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTelemetry();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadTelemetry]);

  useEffect(() => {
    const handleMachineUpdate = (updatedMachines: MachineData[]) => {
      setMachines(Array.isArray(updatedMachines) ? updatedMachines : []);
      refreshPredictiveOverview();
    };

    const handleMachinesUpdate = (payload: { machines?: MachineData[] }) => {
      if (Array.isArray(payload?.machines)) {
        setMachines(payload.machines);
        refreshPredictiveOverview();
      }
    };

    const handleSingleMachineUpdate = (payload: { machine?: MachineData }) => {
      if (payload?.machine) {
        setMachines((currentMachines) =>
          upsertMachine(currentMachines, payload.machine as MachineData)
        );
        refreshPredictiveOverview();
      }
    };

    const handleTelemetryUpdate = (payload: { machine?: MachineData }) => {
      if (payload?.machine) {
        setMachines((currentMachines) =>
          upsertMachine(currentMachines, payload.machine as MachineData)
        );
        refreshPredictiveOverview();
      }
    };

    const handlePredictiveOverview = (nextOverview: PredictiveOverview) => {
      setOverview(nextOverview);
    };

    const handleNewNotification = (payload: NotificationSocketPayload) => {
      const notification: NotificationItem | undefined =
        isWrappedNotificationPayload(payload) ? payload.notification : payload;

      if (!notification?.id) {
        return;
      }

      setNotifications((currentNotifications) =>
        upsertById(currentNotifications, notification)
      );
    };

    const handleNotificationRead = (payload: {
      id: string;
      notification?: NotificationItem;
    }) => {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === payload.id
            ? payload.notification || {
                ...notification,
                read: true,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification
        )
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

    const handleNotificationDeleted = (payload: { id: string }) => {
      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== payload.id
        )
      );
    };

    const handleNotificationsCleared = () => {
      setNotifications([]);
    };

    const handleNewWorkOrder = (workOrder: WorkOrder) => {
      setWorkOrders((currentWorkOrders) =>
        upsertById(currentWorkOrders, workOrder)
      );
    };

    const handleUpdatedWorkOrder = (workOrder: WorkOrder) => {
      setWorkOrders((currentWorkOrders) =>
        upsertById(currentWorkOrders, workOrder)
      );
    };

    const handleDeletedWorkOrder = (payload: { id: string }) => {
      setWorkOrders((currentWorkOrders) =>
        currentWorkOrders.filter((workOrder) => workOrder.id !== payload.id)
      );
    };

    joinPlantRoom("default");

    socket.on(SOCKET_EVENTS.LEGACY_MACHINE_UPDATE, handleMachineUpdate);
    socket.on(SOCKET_EVENTS.MACHINES_UPDATE, handleMachinesUpdate);
    socket.on(SOCKET_EVENTS.MACHINE_UPDATE, handleSingleMachineUpdate);
    socket.on(SOCKET_EVENTS.TELEMETRY_UPDATE, handleTelemetryUpdate);
    socket.on(SOCKET_EVENTS.PREDICTIVE_OVERVIEW, handlePredictiveOverview);
    socket.on(SOCKET_EVENTS.LEGACY_NOTIFICATION_CREATED, handleNewNotification);
    socket.on(SOCKET_EVENTS.NOTIFICATION_CREATED, handleNewNotification);
    socket.on(SOCKET_EVENTS.ALERT_CREATED, handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notifications:readAll", handleAllNotificationsRead);
    socket.on("notification:deleted", handleNotificationDeleted);
    socket.on("notifications:cleared", handleNotificationsCleared);
    socket.on("workorder:new", handleNewWorkOrder);
    socket.on("workorder:updated", handleUpdatedWorkOrder);
    socket.on("workorder:deleted", handleDeletedWorkOrder);

    return () => {
      socket.off(SOCKET_EVENTS.LEGACY_MACHINE_UPDATE, handleMachineUpdate);
      socket.off(SOCKET_EVENTS.MACHINES_UPDATE, handleMachinesUpdate);
      socket.off(SOCKET_EVENTS.MACHINE_UPDATE, handleSingleMachineUpdate);
      socket.off(SOCKET_EVENTS.TELEMETRY_UPDATE, handleTelemetryUpdate);
      socket.off(SOCKET_EVENTS.PREDICTIVE_OVERVIEW, handlePredictiveOverview);
      socket.off(SOCKET_EVENTS.LEGACY_NOTIFICATION_CREATED, handleNewNotification);
      socket.off(SOCKET_EVENTS.NOTIFICATION_CREATED, handleNewNotification);
      socket.off(SOCKET_EVENTS.ALERT_CREATED, handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notifications:readAll", handleAllNotificationsRead);
      socket.off("notification:deleted", handleNotificationDeleted);
      socket.off("notifications:cleared", handleNotificationsCleared);
      socket.off("workorder:new", handleNewWorkOrder);
      socket.off("workorder:updated", handleUpdatedWorkOrder);
      socket.off("workorder:deleted", handleDeletedWorkOrder);

      if (predictiveRefreshRef.current) {
        window.clearTimeout(predictiveRefreshRef.current);
      }

      leavePlantRoom("default");
    };
  }, [refreshPredictiveOverview]);

  const profiles = useMemo(
    () => buildMachineProfiles(machines, overview, notifications, workOrders),
    [machines, notifications, overview, workOrders]
  );
  const kpis = useMemo(
    () => calculateExecutiveKpis(machines, overview, notifications, workOrders),
    [machines, notifications, overview, workOrders]
  );
  const enhancedAlerts = useMemo(
    () => buildEnhancedAlerts(notifications, machines, workOrders),
    [machines, notifications, workOrders]
  );
  const insights = useMemo(
    () => generateAiInsights(profiles, workOrders),
    [profiles, workOrders]
  );

  return {
    machines,
    overview,
    notifications,
    workOrders,
    profiles,
    kpis,
    enhancedAlerts,
    insights,
    isLoading,
    error,
    reload: loadTelemetry,
  };
}
