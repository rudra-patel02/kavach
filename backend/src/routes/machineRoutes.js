import express from "express";

import { getMachine, listMachines } from "../controllers/machineController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { anyPermissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// Read-or-manage: a Manager/Engineer holds machines:manage, a Viewer holds
// machines:read; either can read.
const canRead = anyPermissionMiddleware(["machines:read", "machines:manage"]);

router.get("/", authMiddleware, canRead, listMachines);
router.get("/:id", authMiddleware, canRead, getMachine);

export default router;
