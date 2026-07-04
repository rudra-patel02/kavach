import express from "express";

import { getPredictiveOverview } from "../controllers/predictionController.js";

const router = express.Router();

router.get("/overview", getPredictiveOverview);

export default router;
