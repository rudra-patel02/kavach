import express from "express";

import { exportAuditLogs, getAuditLogs } from "../controllers/auditController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, permissionMiddleware("audit:read"), getAuditLogs);
router.get("/export", authMiddleware, permissionMiddleware("audit:read"), exportAuditLogs);
router.get("/export/:format", authMiddleware, permissionMiddleware("audit:read"), exportAuditLogs);

export default router;
