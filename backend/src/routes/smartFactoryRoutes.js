import express from "express";

import {
  createVisionEvent,
  getProtocolIntegrations,
  getSmartFactoryTwin,
  getVisionOverview,
} from "../controllers/smartFactoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const readRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];

const manageRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
];

router.use(authMiddleware);

router.get("/integrations", roleMiddleware(readRoles), getProtocolIntegrations);
router.get("/twin", roleMiddleware(readRoles), getSmartFactoryTwin);
router.get("/vision", roleMiddleware(readRoles), getVisionOverview);
router.post("/vision/events", roleMiddleware(manageRoles), createVisionEvent);

export default router;
