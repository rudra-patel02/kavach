import mongoose from "mongoose";

import Notification from "../models/notification.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import { serializeNotification } from "../services/notificationService.js";
import { createAuditLog } from "../services/auditService.js";
import User from "../models/user.js";
import {
  getPagination,
  setPaginationHeaders,
} from "../utils/pagination.js";

const getRealtime = (req) => req.app.get("machineGateway") || req.app.get("io");

const isValidId = (id) => mongoose.isValidObjectId(id);

const notificationTypes = [
  "critical_alert",
  "failure_probability",
  "machine_failure",
  "machine_health",
  "maintenance_due",
  "ai_recommendation",
  "production_delay",
  "energy_spike",
  "safety_warning",
  "quality_issue",
  "inventory_alert",
  "temperature",
  "vibration",
  "pressure",
  "power",
  "maintenance",
];

const severities = ["Critical", "High", "Medium", "Low"];

const defaultNotificationPreferences = {
  categories: notificationTypes,
  criticalAlerts: true,
  desktop: true,
  email: true,
  push: true,
  sound: true,
  weeklyReports: true,
};

const normalizeNotificationType = (type = "critical_alert") => {
  const normalizedType = String(type).trim().toLowerCase().replace(/\s+/g, "_");
  return notificationTypes.includes(normalizedType)
    ? normalizedType
    : "critical_alert";
};

const normalizeSeverity = (severity = "Medium") => {
  const normalizedSeverity = String(severity).trim().toLowerCase();
  const severityMap = {
    critical: "Critical",
    high: "High",
    low: "Low",
    medium: "Medium",
  };

  return severityMap[normalizedSeverity] || "Medium";
};

const getPriority = (severity) => {
  if (severity === "Critical") return "P1";
  if (severity === "High") return "P2";
  if (severity === "Medium") return "P3";
  return "P4";
};

const buildNotificationQuery = (req) => {
  const { query } = req;
  const filters = {};

  if (query.archived === "true") {
    filters.archived = true;
  } else if (query.archived === "all") {
    // Include both active and archived notifications.
  } else {
    filters.archived = { $ne: true };
  }

  if (query.type || query.category) {
    filters.type = normalizeNotificationType(query.type || query.category);
  }

  if (query.severity) {
    filters.severity = normalizeSeverity(query.severity);
  }

  if (query.read === "true" || query.read === "false") {
    filters.read = query.read === "true";
  }

  if (query.cursor) {
    const cursorDate = new Date(query.cursor);

    if (!Number.isNaN(cursorDate.getTime())) {
      filters.createdAt = { $lt: cursorDate };
    }
  }

  if (query.search) {
    const search = String(query.search).trim();
    filters.$or = [
      { machineId: new RegExp(search, "i") },
      { machineName: new RegExp(search, "i") },
      { message: new RegExp(search, "i") },
      { priority: new RegExp(search, "i") },
      { severity: new RegExp(search, "i") },
      { title: new RegExp(search, "i") },
      { type: new RegExp(search, "i") },
    ];
  }

  return buildTenantScopedQuery(req, filters);
};

const buildNotificationIdQuery = (req, id) =>
  buildTenantScopedQuery(req, { _id: id });

const emitRealtime = (realtime, method, event, payload) => {
  if (realtime?.[method]) {
    realtime[method](payload);
  } else {
    realtime?.emit(event, payload);
  }
};

const getUserPreferences = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return defaultNotificationPreferences;
  }

  const user = await User.findById(userId).select("notificationPreferences").lean();
  return {
    ...defaultNotificationPreferences,
    ...(user?.notificationPreferences || {}),
  };
};

export const getNotifications = async (req, res) => {
  try {
    const pagination = getPagination({
      defaultLimit: 50,
      maxLimit: 200,
      query: req.query,
    });
    const filters = buildNotificationQuery(req);
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit + 1)
      .lean();
    const hasMore = notifications.length > pagination.limit;
    const page = hasMore
      ? notifications.slice(0, pagination.limit)
      : notifications;
    const unreadCount = await Notification.countDocuments(
      buildTenantScopedQuery(req, {
        archived: { $ne: true },
        read: false,
      })
    );

    setPaginationHeaders(res, {
      count: page.length,
      limit: pagination.limit,
      page: pagination.page,
    });

    res.json({
      success: true,
      unreadCount,
      nextCursor: hasMore
        ? page.at(-1)?.createdAt
          ? new Date(page.at(-1).createdAt).toISOString()
          : null
        : null,
      notifications: page.map(serializeNotification),
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const createNotification = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const type = normalizeNotificationType(req.body.type);
    const severity = normalizeSeverity(req.body.severity);
    const notification = await Notification.create({
      assetId: req.body.assetId || "",
      category: req.body.category || type,
      channels: Array.isArray(req.body.channels) ? req.body.channels : ["push"],
      dedupeKey:
        req.body.dedupeKey ||
        `manual:${type}:${Date.now()}:${Math.floor(Math.random() * 10000)}`,
      description: req.body.description || message,
      estimatedDowntimeHours: Number(req.body.estimatedDowntimeHours) || 0,
      icon: req.body.icon || "bell",
      machineId: req.body.machineId || "",
      machineLocation: req.body.machineLocation || "",
      machineName: req.body.machineName || "Plant-wide",
      message,
      organizationId: req.body.organizationId || req.user?.organizationId || "",
      owner: req.body.owner || "",
      plantId: req.body.plantId || req.user?.activePlantId || "",
      priority: req.body.priority || getPriority(severity),
      recommendedEngineer: req.body.recommendedEngineer || "",
      severity,
      suggestedAction: req.body.suggestedAction || "",
      tenantId: req.body.tenantId || req.user?.tenantId || req.tenantContext?.tenantId || "",
      title,
      type,
      value: req.body.value,
      threshold: req.body.threshold,
      alertTimeline: [
        {
          actor: req.user?.name || req.user?.email || "Notification Center",
          event: "NOTIFICATION_CREATED",
          message,
        },
      ],
      alertHistory: [
        {
          actor: req.user?.name || req.user?.email || "Notification Center",
          event: "NOTIFICATION_CREATED",
          message,
        },
      ],
    });
    const serializedNotification = serializeNotification(notification);
    const realtime = getRealtime(req);

    emitRealtime(realtime, "broadcastAlert", "notification:new", serializedNotification);

    await createAuditLog({
      action: "NOTIFICATION_CREATED",
      newValue: serializedNotification,
      req,
      resourceId: serializedNotification.id,
      resourceType: "notification",
    });

    res.status(201).json({
      success: true,
      notification: serializedNotification,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const read = req.body.read === false ? false : true;
    const notification = await Notification.findOneAndUpdate(
      buildNotificationIdQuery(req, req.params.id),
      {
        read,
        readAt: read ? new Date() : null,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const serializedNotification = serializeNotification(notification);
    const eventPayload = {
      id: serializedNotification.id,
      notification: serializedNotification,
    };
    const realtime = getRealtime(req);

    emitRealtime(
      realtime,
      "broadcastNotificationRead",
      "notification:read",
      eventPayload
    );

    await createAuditLog({
      action: "ALERT_ACKNOWLEDGED",
      newValue: serializedNotification,
      req,
      resourceId: serializedNotification.id,
      resourceType: "notification",
    });

    res.json({
      success: true,
      notification: serializedNotification,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const archiveNotification = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const archived = req.body.archived === false ? false : true;
    const notification = await Notification.findOneAndUpdate(
      buildNotificationIdQuery(req, req.params.id),
      {
        archived,
        archivedAt: archived ? new Date() : null,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const serializedNotification = serializeNotification(notification);
    const eventPayload = {
      id: serializedNotification.id,
      notification: serializedNotification,
    };
    const realtime = getRealtime(req);

    realtime?.emit("notification:archived", eventPayload);

    await createAuditLog({
      action: archived ? "NOTIFICATION_ARCHIVED" : "NOTIFICATION_UNARCHIVED",
      newValue: serializedNotification,
      req,
      resourceId: serializedNotification.id,
      resourceType: "notification",
    });

    res.json({
      success: true,
      notification: serializedNotification,
    });
  } catch (error) {
    console.error("Failed to archive notification:", error);
    res.status(500).json({ message: "Failed to archive notification" });
  }
};

export const archiveNotifications = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.filter((id) => isValidId(id))
      : [];
    const archivedAt = new Date();
    const filter = buildTenantScopedQuery(
      req,
      ids.length > 0 ? { _id: { $in: ids } } : { archived: { $ne: true } }
    );
    const result = await Notification.updateMany(filter, {
      archived: true,
      archivedAt,
    });
    const realtime = getRealtime(req);

    realtime?.emit("notifications:archived", {
      archivedAt: archivedAt.toISOString(),
      ids,
      modifiedCount: result.modifiedCount,
    });

    await createAuditLog({
      action: "NOTIFICATIONS_ARCHIVED",
      metadata: { ids, modifiedCount: result.modifiedCount },
      req,
      resourceType: "notification",
    });

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      unreadCount: await Notification.countDocuments(
        buildTenantScopedQuery(req, {
          archived: { $ne: true },
          read: false,
        })
      ),
    });
  } catch (error) {
    console.error("Failed to archive notifications:", error);
    res.status(500).json({ message: "Failed to archive notifications" });
  }
};

export const getNotificationPreferences = async (req, res) => {
  try {
    res.json({
      success: true,
      preferences: await getUserPreferences(req.user?.id),
    });
  } catch (error) {
    console.error("Failed to load notification preferences:", error);
    res.status(500).json({ message: "Failed to load notification preferences" });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(400).json({ message: "Valid user context is required" });
    }

    const currentPreferences = await getUserPreferences(req.user.id);
    const nextPreferences = {
      ...currentPreferences,
      ...req.body,
      categories: Array.isArray(req.body.categories)
        ? req.body.categories.map(normalizeNotificationType)
        : currentPreferences.categories,
    };
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationPreferences: nextPreferences },
      { new: true }
    ).select("notificationPreferences");

    await createAuditLog({
      action: "NOTIFICATION_PREFERENCES_UPDATED",
      newValue: user?.notificationPreferences,
      oldValue: currentPreferences,
      req,
      resourceId: req.user.id,
      resourceType: "notificationPreferences",
    });

    res.json({
      success: true,
      preferences: {
        ...defaultNotificationPreferences,
        ...(user?.notificationPreferences?.toObject?.() ||
          user?.notificationPreferences ||
          {}),
      },
    });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const readAt = new Date();
    const result = await Notification.updateMany(
      buildTenantScopedQuery(req, { read: false }),
      {
        read: true,
        readAt,
      }
    );

    const eventPayload = {
      readAt: readAt.toISOString(),
    };
    const realtime = getRealtime(req);

    emitRealtime(
      realtime,
      "broadcastAllNotificationsRead",
      "notifications:readAll",
      eventPayload
    );

    await createAuditLog({
      action: "ALERTS_ACKNOWLEDGED_ALL",
      metadata: { modifiedCount: result.modifiedCount },
      req,
      resourceType: "notification",
    });

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndDelete(
      buildNotificationIdQuery(req, req.params.id)
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const eventPayload = {
      id: String(notification._id),
    };
    const realtime = getRealtime(req);

    emitRealtime(
      realtime,
      "broadcastNotificationDeleted",
      "notification:deleted",
      eventPayload
    );

    await createAuditLog({
      action: "NOTIFICATION_DELETED",
      oldValue: serializeNotification(notification),
      req,
      resourceId: notification._id,
      resourceType: "notification",
    });

    res.json({
      success: true,
      deletedId: String(notification._id),
    });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany(buildTenantScopedQuery(req, {}));

    const realtime = getRealtime(req);

    if (realtime?.broadcastNotificationsCleared) {
      realtime.broadcastNotificationsCleared();
    } else {
      realtime?.emit("notifications:cleared");
    }

    await createAuditLog({
      action: "NOTIFICATIONS_CLEARED",
      metadata: { deletedCount: result.deletedCount },
      req,
      resourceType: "notification",
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};
