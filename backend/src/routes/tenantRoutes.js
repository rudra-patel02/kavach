import express from "express";

import {
  createDepartment,
  createMachineGroup,
  createOrganization,
  createPlant,
  createProductionLine,
  getTenantOverview,
  switchPlant,
} from "../controllers/tenantController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";
import { requireFields } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, permissionMiddleware("plants:manage"), getTenantOverview);
router.post(
  "/organizations",
  authMiddleware,
  permissionMiddleware("plants:manage"),
  requireFields(["name"]),
  createOrganization
);
router.post(
  "/plants",
  authMiddleware,
  permissionMiddleware("plants:manage"),
  requireFields(["name", "organizationId"]),
  createPlant
);
router.post(
  "/departments",
  authMiddleware,
  permissionMiddleware("plants:manage"),
  requireFields(["name", "plantId"]),
  createDepartment
);
router.post(
  "/production-lines",
  authMiddleware,
  permissionMiddleware("plants:manage"),
  requireFields(["name", "plantId"]),
  createProductionLine
);
router.post(
  "/machine-groups",
  authMiddleware,
  permissionMiddleware("plants:manage"),
  requireFields(["name", "plantId"]),
  createMachineGroup
);
router.post("/switch-plant", authMiddleware, switchPlant);

export default router;
