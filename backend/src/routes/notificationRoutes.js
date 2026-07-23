import express from "express";

import {
  archiveNotification,
  archiveNotifications,
  clearNotifications,
  createNotification,
  deleteNotification,
  getNotifications,
  getNotificationPreferences,
  getPushSubscriptionStatus,
  markAllNotificationsRead,
  markNotificationRead,
  previewPushNotification,
  registerPushSubscription,
  unregisterPushSubscription,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const alertRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];
const manageRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
];

router.get("/", authMiddleware, roleMiddleware(alertRoles), getNotifications);
router.post("/", authMiddleware, roleMiddleware(manageRoles), createNotification);
router.get("/preferences", authMiddleware, roleMiddleware(alertRoles), getNotificationPreferences);
router.patch("/preferences", authMiddleware, roleMiddleware(alertRoles), updateNotificationPreferences);
router.get("/push/status", authMiddleware, roleMiddleware(alertRoles), getPushSubscriptionStatus);
router.post("/push/subscribe", authMiddleware, roleMiddleware(alertRoles), registerPushSubscription);
router.post("/push/unsubscribe", authMiddleware, roleMiddleware(alertRoles), unregisterPushSubscription);
router.post("/push/preview", authMiddleware, roleMiddleware(manageRoles), previewPushNotification);
router.patch("/read", authMiddleware, roleMiddleware(manageRoles), markAllNotificationsRead);
router.patch("/archive", authMiddleware, roleMiddleware(manageRoles), archiveNotifications);
router.patch("/:id/read", authMiddleware, roleMiddleware(manageRoles), markNotificationRead);
router.patch("/:id/archive", authMiddleware, roleMiddleware(manageRoles), archiveNotification);
router.delete("/", authMiddleware, roleMiddleware(["Super Admin", "Admin"]), clearNotifications);
router.delete("/:id", authMiddleware, roleMiddleware(manageRoles), deleteNotification);

export default router;
