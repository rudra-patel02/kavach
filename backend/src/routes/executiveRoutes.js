import express from "express";

import { getExecutiveDashboard } from "../controllers/executiveController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["Super Admin", "Admin", "Plant Manager"]),
  getExecutiveDashboard
);

export default router;
