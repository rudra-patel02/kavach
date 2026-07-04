import Machine from "../models/machine.js";
import {
  buildCopilotReport,
  buildCopilotResponse,
} from "../services/copilotAnalysisService.js";

export const chatWithCopilot = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        message: "Message must be 1000 characters or fewer",
      });
    }

    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    const response = buildCopilotResponse(message, machines);

    res.json({
      success: true,
      message,
      ...response,
    });
  } catch (error) {
    console.error("Copilot chat failed:", error);
    res.status(500).json({
      message: "Failed to generate copilot response",
    });
  }
};

export const getCopilotReport = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    const report = buildCopilotReport(machines);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Copilot report failed:", error);
    res.status(500).json({
      message: "Failed to generate copilot report",
    });
  }
};
