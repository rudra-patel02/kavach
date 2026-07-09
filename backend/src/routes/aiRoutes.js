import express from "express";

import { chatWithAi, getAiReport } from "../controllers/aiController.js";
import {
  analyzeMachineNow,
  generateMachinePlanner,
  getAiHistoryController,
  getAiOverview,
  getExecutiveInsights,
  getFleetHealth,
  getMachineAiIntelligence,
  getMachineForecast,
  getMachinePlanner,
  getMachinePrediction,
  getMachineRootCause,
} from "../controllers/aiIntelligenceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const readRoles = [
  "Super Admin",
  "Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];
const decisionRoles = [
  "Super Admin",
  "Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
];

router.post(
  "/chat",
  authMiddleware,
  roleMiddleware([
    "Super Admin",
    "Admin",
    "Plant Manager",
    "Maintenance Engineer",
    "Operator",
  ]),
  chatWithAi
);

router.get(
  "/report",
  authMiddleware,
  roleMiddleware([
    "Super Admin",
    "Admin",
    "Plant Manager",
    "Maintenance Engineer",
  ]),
  getAiReport
);

router.get("/overview", authMiddleware, roleMiddleware(readRoles), getAiOverview);
router.get("/fleet-health", authMiddleware, roleMiddleware(readRoles), getFleetHealth);
router.get(
  "/executive-insights",
  authMiddleware,
  roleMiddleware([
    "Super Admin",
    "Admin",
    "Plant Admin",
    "Plant Manager",
    "Maintenance Manager",
  ]),
  getExecutiveInsights
);
router.get("/history", authMiddleware, roleMiddleware(readRoles), getAiHistoryController);
router.get(
  "/machine/:machineId",
  authMiddleware,
  roleMiddleware(readRoles),
  getMachineAiIntelligence
);
router.post(
  "/machine/:machineId/analyze",
  authMiddleware,
  roleMiddleware(decisionRoles),
  analyzeMachineNow
);
router.get(
  "/forecast/:machineId",
  authMiddleware,
  roleMiddleware(readRoles),
  getMachineForecast
);
router.get(
  "/prediction/:machineId",
  authMiddleware,
  roleMiddleware(readRoles),
  getMachinePrediction
);
router.get(
  "/planner/:machineId",
  authMiddleware,
  roleMiddleware(readRoles),
  getMachinePlanner
);
router.post(
  "/planner/:machineId",
  authMiddleware,
  roleMiddleware(decisionRoles),
  generateMachinePlanner
);
router.get(
  "/root-cause/:machineId",
  authMiddleware,
  roleMiddleware(readRoles),
  getMachineRootCause
);

export default router;
