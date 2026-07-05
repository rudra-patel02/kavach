import express from "express";

import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.patch("/read", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/", clearNotifications);
router.delete("/:id", deleteNotification);

export default router;
