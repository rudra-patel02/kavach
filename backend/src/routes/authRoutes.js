import express from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import {
  bruteForceProtection,
  rateLimit,
} from "../middleware/securityMiddleware.js";

const router = express.Router();
const authLimiter = rateLimit({
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 25),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
});

router.post("/register", authLimiter, register);

router.post("/login", authLimiter, bruteForceProtection(), login);

router.post("/refresh", authLimiter, refresh);

router.post("/logout", logout);

export default router;
