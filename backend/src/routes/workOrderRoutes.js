import express from "express";

import {
  createWorkOrder,
  getWorkOrder,
  getWorkOrders,
  patchWorkOrder,
  removeWorkOrder,
} from "../controllers/workOrderController.js";

const router = express.Router();

router.get("/", getWorkOrders);
router.get("/:id", getWorkOrder);
router.post("/", createWorkOrder);
router.patch("/:id", patchWorkOrder);
router.delete("/:id", removeWorkOrder);

export default router;
