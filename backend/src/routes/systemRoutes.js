import express from "express";

import { getSystemHealth } from "../controllers/systemController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
  "/health",
  authMiddleware,
  permissionMiddleware("system:read"),
  getSystemHealth
);

export default router;
