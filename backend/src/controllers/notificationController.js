import mongoose from "mongoose";

import Notification from "../models/notification.js";
import { serializeNotification } from "../services/notificationService.js";
import { createAuditLog } from "../services/auditService.js";

const getRealtime = (req) => req.app.get("machineGateway") || req.app.get("io");

const isValidId = (id) => mongoose.isValidObjectId(id);

export const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      unreadCount,
      notifications: notifications.map(serializeNotification),
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
        readAt: new Date(),
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

    if (realtime?.broadcastNotificationRead) {
      realtime.broadcastNotificationRead(eventPayload);
    } else {
      realtime?.emit("notification:read", eventPayload);
    }

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

export const markAllNotificationsRead = async (req, res) => {
  try {
    const readAt = new Date();
    const result = await Notification.updateMany(
      { read: false },
      {
        read: true,
        readAt,
      }
    );

    const eventPayload = {
      readAt: readAt.toISOString(),
    };
    const realtime = getRealtime(req);

    if (realtime?.broadcastAllNotificationsRead) {
      realtime.broadcastAllNotificationsRead(eventPayload);
    } else {
      realtime?.emit("notifications:readAll", eventPayload);
    }

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

    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const eventPayload = {
      id: String(notification._id),
    };
    const realtime = getRealtime(req);

    if (realtime?.broadcastNotificationDeleted) {
      realtime.broadcastNotificationDeleted(eventPayload);
    } else {
      realtime?.emit("notification:deleted", eventPayload);
    }

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
    const result = await Notification.deleteMany({});

    const realtime = getRealtime(req);

    if (realtime?.broadcastNotificationsCleared) {
      realtime.broadcastNotificationsCleared();
    } else {
      realtime?.emit("notifications:cleared");
    }

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
