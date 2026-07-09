import express from "express";

import {
  getSettings,
  updatePassword,
  updatePreferences,
  updateProfile,
} from "../controllers/settingsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getSettings);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/password", authMiddleware, updatePassword);
router.patch("/preferences", authMiddleware, updatePreferences);

export default router;
