import express from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { permissionMiddleware } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("users:manage"),
  getUsers
);
router.post("/", authMiddleware, permissionMiddleware("users:manage"), createUser);
router.put("/:id", authMiddleware, permissionMiddleware("users:manage"), updateUser);
router.patch("/:id", authMiddleware, permissionMiddleware("users:manage"), updateUser);
router.delete("/:id", authMiddleware, permissionMiddleware("users:manage"), deleteUser);

export default router;
