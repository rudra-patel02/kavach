import express from "express";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from "../controllers/machineController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const readRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];
const writeRoles = ["Super Admin", "Admin", "Plant Manager", "Maintenance Engineer"];

// Get all machines
router.get("/", authMiddleware, roleMiddleware(readRoles), getMachines);

// Get machine by ID
router.get("/:id", authMiddleware, roleMiddleware(readRoles), getMachineById);

// Create machine
router.post("/", authMiddleware, roleMiddleware(writeRoles), createMachine);

// Update machine
router.put("/:id", authMiddleware, roleMiddleware(writeRoles), updateMachine);

// Delete machine
router.delete("/:id", authMiddleware, roleMiddleware(["Super Admin", "Admin"]), deleteMachine);

export default router;
