import express from "express";

import { exportKpiReport } from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// All three roles hold reports:read. The export mirrors the dashboard KPIs.
router.get("/kpis", authMiddleware, permissionMiddleware("reports:read"), exportKpiReport);

export default router;
