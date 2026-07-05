import express from "express";

import {
  createWorkOrder,
  getWorkOrder,
  getWorkOrders,
  getWorkOrderStats,
  patchWorkOrder,
  removeWorkOrder,
} from "../controllers/workOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const readRoles = [
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

router.get("/", authMiddleware, roleMiddleware(readRoles), getWorkOrders);
router.get("/stats", authMiddleware, roleMiddleware(readRoles), getWorkOrderStats);
router.get("/:id", authMiddleware, roleMiddleware(readRoles), getWorkOrder);
router.post("/", authMiddleware, roleMiddleware(manageRoles), createWorkOrder);
router.patch("/:id", authMiddleware, roleMiddleware(manageRoles), patchWorkOrder);
router.delete("/:id", authMiddleware, roleMiddleware(["Super Admin", "Admin", "Plant Manager"]), removeWorkOrder);

export default router;
