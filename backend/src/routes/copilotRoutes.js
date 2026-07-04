import express from "express";

import {
  chatWithCopilot,
  getCopilotReport,
} from "../controllers/copilotController.js";

const router = express.Router();

router.post("/chat", chatWithCopilot);
router.get("/report", getCopilotReport);

export default router;
