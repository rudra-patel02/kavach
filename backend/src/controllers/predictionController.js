import Machine from "../models/machine.js";
import { buildPredictiveOverview } from "../services/predictionService.js";

export const getPredictiveOverview = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    const overview = buildPredictiveOverview(machines);

    res.json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error("Predictive overview failed:", error);
    res.status(500).json({
      message: "Failed to generate predictive maintenance overview",
    });
  }
};
