import {
  buildAiCopilotResponse,
  buildAiProviderPayload,
} from "../services/aiCopilotService.js";
import { buildCopilotReport } from "../services/copilotAnalysisService.js";
import { loadCopilotContext } from "../services/copilotContextService.js";
import { validateCopilotChatPayload } from "../validators/copilotValidator.js";

export const chatWithAi = async (req, res) => {
  try {
    const { message } = validateCopilotChatPayload(req.body);
    const context = await loadCopilotContext();
    const response = await buildAiCopilotResponse(message, context);

    res.json({
      success: true,
      message,
      ...response,
    });
  } catch (error) {
    console.error("AI copilot chat failed:", error);
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      message:
        statusCode < 500
          ? error.message
          : "Failed to generate AI copilot response",
    });
  }
};

export const getAiReport = async (req, res) => {
  try {
    const context = await loadCopilotContext();
    const report = buildCopilotReport(context.machines);

    res.json({
      success: true,
      report,
      providerPayload: buildAiProviderPayload("Generate plant report", context),
    });
  } catch (error) {
    console.error("AI report failed:", error);
    res.status(500).json({
      message: "Failed to generate AI report",
    });
  }
};
