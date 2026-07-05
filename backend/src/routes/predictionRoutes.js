import express from "express";

import {
  getPredictiveMachine,
  getPredictiveOverview,
} from "../controllers/predictionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/overview",
  authMiddleware,
  roleMiddleware([
    "Super Admin",
    "Plant Manager",
    "Maintenance Engineer",
  ]),
  getPredictiveOverview
);

router.get(
  "/:machineId",
  authMiddleware,
  roleMiddleware([
    "Super Admin",
    "Admin",
    "Plant Manager",
    "Maintenance Engineer",
    "Operator",
  ]),
  getPredictiveMachine
);

export default router;
