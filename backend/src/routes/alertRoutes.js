import express from "express";

import { acknowledge, listAlerts } from "../controllers/alertController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// Anyone who can read the dashboard can see alerts; only a Manager (alerts:manage)
// can acknowledge — matches the "manager acknowledges and assigns" flow.
router.get("/", authMiddleware, permissionMiddleware("dashboard:read"), listAlerts);
router.patch(
  "/:id/acknowledge",
  authMiddleware,
  permissionMiddleware("alerts:manage"),
  acknowledge
);

export default router;
