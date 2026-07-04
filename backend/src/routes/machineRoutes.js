import express from "express";
import {
  getMachines,
  getMachine,
} from "../controllers/machineController.js";

const router = express.Router();

router.get("/", getMachines);

router.get("/:id", getMachine);

export default router;