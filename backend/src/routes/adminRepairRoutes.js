import express from "express";

import { repairSeedAdmin } from "../controllers/adminRepairController.js";

const router = express.Router();

router.post("/repair-seed", repairSeedAdmin);

export default router;
