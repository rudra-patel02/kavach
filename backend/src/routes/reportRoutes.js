import express from "express";

import {
  downloadReportPdf,
  generateReport,
  getReportCatalog,
} from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const reportRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
];

router.post("/generate", authMiddleware, roleMiddleware(reportRoles), generateReport);
router.get("/", authMiddleware, roleMiddleware(reportRoles), getReportCatalog);
router.get("/:type/pdf", authMiddleware, roleMiddleware(reportRoles), downloadReportPdf);
router.get("/:type", authMiddleware, roleMiddleware(reportRoles), generateReport);

export default router;
