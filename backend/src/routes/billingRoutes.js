import express from "express";

import {
  getSubscription,
  listInvoices,
  listPlans,
  upsertSubscription,
} from "../controllers/billingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/plans", authMiddleware, listPlans);
router.get("/subscription", authMiddleware, getSubscription);
router.post(
  "/subscription",
  authMiddleware,
  permissionMiddleware("enterprise:manage"),
  upsertSubscription
);
router.get(
  "/invoices",
  authMiddleware,
  permissionMiddleware("enterprise:manage"),
  listInvoices
);

export default router;
