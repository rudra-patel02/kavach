import Machine from "../models/machine.js";
import {
  buildAiCopilotResponse,
  buildAiProviderPayload,
} from "../services/aiCopilotService.js";
import { buildCopilotReport } from "../services/copilotAnalysisService.js";

const MAX_MESSAGE_LENGTH = 1500;

export const chatWithAi = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      });
    }

    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    const response = await buildAiCopilotResponse(message, machines);

    res.json({
      success: true,
      message,
      ...response,
    });
  } catch (error) {
    console.error("AI copilot chat failed:", error);
    res.status(500).json({
      message: "Failed to generate AI copilot response",
    });
  }
};

export const getAiReport = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    const report = buildCopilotReport(machines);

    res.json({
      success: true,
      report,
      providerPayload: buildAiProviderPayload("Generate plant report", machines),
    });
  } catch (error) {
    console.error("AI report failed:", error);
    res.status(500).json({
      message: "Failed to generate AI report",
    });
  }
};
