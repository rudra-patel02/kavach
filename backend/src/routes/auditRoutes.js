import express from "express";

import { getAuditLogs } from "../controllers/auditController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, permissionMiddleware("audit:read"), getAuditLogs);

export default router;
