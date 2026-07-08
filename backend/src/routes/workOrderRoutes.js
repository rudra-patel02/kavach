import express from "express";

import {
  createWorkOrder,
  getWorkOrder,
  listWorkOrders,
  updateWorkOrder,
} from "../controllers/workOrderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  anyPermissionMiddleware,
  permissionMiddleware,
} from "../middleware/permissionMiddleware.js";

const router = express.Router();

// List + detail: any authenticated caller who can read OR manage work orders
// (all three roles), scoped to the caller inside the controller. Read-or-manage
// because a Manager holds workorders:manage (which implies read) but not the
// literal workorders:read.
const canReadWorkOrders = anyPermissionMiddleware([
  "workorders:read",
  "workorders:manage",
]);

router.get("/", authMiddleware, canReadWorkOrders, listWorkOrders);
router.get("/:id", authMiddleware, canReadWorkOrders, getWorkOrder);

// Create + assign: Manager only (build-spec: the manager creates + assigns).
router.post("/", authMiddleware, roleMiddleware(["Manager"]), createWorkOrder);

// Advance / update: Manager or Engineer (both hold workorders:manage); a Viewer
// is 403. Engineer-vs-manager rules and ownership are enforced in the controller.
router.patch(
  "/:id",
  authMiddleware,
  permissionMiddleware("workorders:manage"),
  updateWorkOrder
);

export default router;
