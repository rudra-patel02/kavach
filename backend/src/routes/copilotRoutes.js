import express from "express";

import {
  chatWithCopilot,
  getCopilotReport,
} from "../controllers/copilotController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const copilotRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
];

router.post("/chat", authMiddleware, roleMiddleware(copilotRoles), chatWithCopilot);
router.get("/report", authMiddleware, roleMiddleware(copilotRoles), getCopilotReport);

export default router;
