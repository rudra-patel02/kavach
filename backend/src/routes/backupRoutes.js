import express from "express";

import {
  createServerBackup,
  exportBackup,
  exportConfiguration,
  getBackupLogs,
  restoreBackup,
} from "../controllers/backupController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/export", authMiddleware, permissionMiddleware("backup:read"), exportBackup);
router.post(
  "/export",
  authMiddleware,
  permissionMiddleware("backup:read"),
  createServerBackup
);
router.get("/logs", authMiddleware, permissionMiddleware("backup:read"), getBackupLogs);
router.get(
  "/configuration",
  authMiddleware,
  permissionMiddleware("backup:read"),
  exportConfiguration
);
router.post(
  "/restore",
  authMiddleware,
  permissionMiddleware("config:write"),
  restoreBackup
);

export default router;
