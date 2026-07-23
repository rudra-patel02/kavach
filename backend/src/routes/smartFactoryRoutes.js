import express from "express";

import {
  createVisionEvent,
  getVisionCameraDashboard,
  getVisionEventTimeline,
  getProtocolIntegrations,
  getSmartFactoryTwin,
  getVisionOverview,
  updateVisionCameraStatus,
  updateVisionEventStatus,
  upsertVisionCamera,
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
router.get("/vision/cameras", roleMiddleware(readRoles), getVisionCameraDashboard);
router.post("/vision/cameras", roleMiddleware(manageRoles), upsertVisionCamera);
router.patch("/vision/cameras/:cameraId/status", roleMiddleware(manageRoles), updateVisionCameraStatus);
router.get("/vision/timeline", roleMiddleware(readRoles), getVisionEventTimeline);
router.post("/vision/events", roleMiddleware(manageRoles), createVisionEvent);
router.patch("/vision/events/:eventId/status", roleMiddleware(manageRoles), updateVisionEventStatus);

export default router;
