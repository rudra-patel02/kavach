import express from "express";

import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
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
router.patch("/read", authMiddleware, roleMiddleware(manageRoles), markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, roleMiddleware(manageRoles), markNotificationRead);
router.delete("/", authMiddleware, roleMiddleware(["Super Admin", "Admin"]), clearNotifications);
router.delete("/:id", authMiddleware, roleMiddleware(manageRoles), deleteNotification);

export default router;
