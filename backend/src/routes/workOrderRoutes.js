import express from "express";

import {
  assignWorkOrder,
  completeWorkOrder,
  createWorkOrder,
  exportWorkOrders,
  getWorkOrder,
  getWorkOrders,
  getWorkOrderStats,
  patchWorkOrder,
  printWorkOrder,
  replaceWorkOrder,
  removeWorkOrder,
  updateWorkOrderStatus,
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
router.get("/export", authMiddleware, roleMiddleware(readRoles), exportWorkOrders);
router.get("/export/:format", authMiddleware, roleMiddleware(readRoles), exportWorkOrders);
router.patch("/status", authMiddleware, roleMiddleware(manageRoles), updateWorkOrderStatus);
router.patch("/assign", authMiddleware, roleMiddleware(manageRoles), assignWorkOrder);
router.patch("/complete", authMiddleware, roleMiddleware(manageRoles), completeWorkOrder);
router.get("/:id", authMiddleware, roleMiddleware(readRoles), getWorkOrder);
router.get("/:id/print", authMiddleware, roleMiddleware(readRoles), printWorkOrder);
router.post("/", authMiddleware, roleMiddleware(manageRoles), createWorkOrder);
router.put("/:id", authMiddleware, roleMiddleware(manageRoles), replaceWorkOrder);
router.patch("/:id", authMiddleware, roleMiddleware(manageRoles), patchWorkOrder);
router.patch("/:id/status", authMiddleware, roleMiddleware(manageRoles), updateWorkOrderStatus);
router.patch("/:id/assign", authMiddleware, roleMiddleware(manageRoles), assignWorkOrder);
router.patch("/:id/complete", authMiddleware, roleMiddleware(manageRoles), completeWorkOrder);
router.delete("/:id", authMiddleware, roleMiddleware(["Super Admin", "Admin", "Plant Manager"]), removeWorkOrder);

export default router;
