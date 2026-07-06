import express from "express";

import {
  exportBackup,
  exportConfiguration,
  restoreBackup,
} from "../controllers/backupController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/export", authMiddleware, permissionMiddleware("backup:read"), exportBackup);
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
