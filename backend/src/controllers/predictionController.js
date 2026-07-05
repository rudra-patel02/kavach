import Machine from "../models/machine.js";
import {
  buildPredictiveMachineDetail,
  buildPredictiveOverview,
} from "../services/predictionService.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

export const getPredictiveMachine = async (req, res) => {
  try {
    const machineId = String(req.params.machineId || "").trim();

    if (!machineId) {
      return res.status(400).json({
        message: "Machine ID is required",
      });
    }

    const machine = await Machine.findOne({
      $or: [
        { machineId },
        { name: new RegExp(`^${escapeRegex(machineId)}$`, "i") },
      ],
    }).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    const detail = buildPredictiveMachineDetail(machine);

    res.json({
      success: true,
      detail,
    });
  } catch (error) {
    console.error("Predictive machine detail failed:", error);
    res.status(500).json({
      message: "Failed to generate machine prediction",
    });
  }
};
