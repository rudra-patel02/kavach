import express from "express";

import {
  exportAnalyticsCsv,
  getAnalyticsOverview,
} from "../controllers/analyticsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const analyticsRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
];

router.get("/overview", authMiddleware, roleMiddleware(analyticsRoles), getAnalyticsOverview);
router.get("/export.csv", authMiddleware, roleMiddleware(analyticsRoles), exportAnalyticsCsv);

export default router;
