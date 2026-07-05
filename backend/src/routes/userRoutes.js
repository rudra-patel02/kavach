import express from "express";
import { getUsers } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Super Admin", "Admin", "Plant Manager"]),
  getUsers
);

export default router;
