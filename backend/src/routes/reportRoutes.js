import express from "express";

import {
  downloadReportPdf,
  generateReport,
  getReportAutomationStatus,
  getReportCatalog,
  runDueReportSchedules,
} from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const reportRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];

router.post("/generate", authMiddleware, roleMiddleware(reportRoles), generateReport);
router.get("/", authMiddleware, roleMiddleware(reportRoles), getReportCatalog);
router.get("/automation/status", authMiddleware, roleMiddleware(reportRoles), getReportAutomationStatus);
router.post("/automation/run-due", authMiddleware, roleMiddleware([
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
]), runDueReportSchedules);
router.get("/:type/pdf", authMiddleware, roleMiddleware(reportRoles), downloadReportPdf);
router.get("/:type", authMiddleware, roleMiddleware(reportRoles), generateReport);

export default router;
