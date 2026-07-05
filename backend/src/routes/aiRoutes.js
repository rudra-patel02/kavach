import express from "express";

import { chatWithAi, getAiReport } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

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

export default router;
