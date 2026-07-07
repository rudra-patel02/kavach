import express from "express";

import { getKpis } from "../controllers/kpiController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// All three roles (Manager/Engineer/Viewer) hold dashboard:read.
router.get("/", authMiddleware, permissionMiddleware("dashboard:read"), getKpis);

export default router;
