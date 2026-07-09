import { buildAiCopilotResponse } from "../services/aiCopilotService.js";
import {
  buildCopilotReport,
} from "../services/copilotAnalysisService.js";
import { loadCopilotContext } from "../services/copilotContextService.js";
import { validateCopilotChatPayload } from "../validators/copilotValidator.js";

export const chatWithCopilot = async (req, res) => {
  try {
    const { message, stream } = validateCopilotChatPayload(req.body);
    const context = await loadCopilotContext();
    const response = await buildAiCopilotResponse(message, context);

    if (stream || req.accepts("text/event-stream")) {
      res.writeHead(200, {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
      });
      res.write(
        `event: meta\ndata: ${JSON.stringify({
          ...response,
          answer: "",
          message,
          success: true,
        })}\n\n`
      );

      for (const token of response.answer.match(/\S+\s*/g) || []) {
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      }

      res.write(
        `event: done\ndata: ${JSON.stringify({
          success: true,
          message,
          ...response,
        })}\n\n`
      );
      res.end();
      return;
    }

    res.json({
      success: true,
      message,
      ...response,
    });
  } catch (error) {
    console.error("Copilot chat failed:", error);
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      message:
        statusCode < 500
          ? error.message
          : "Failed to generate copilot response",
    });
  }
};

export const getCopilotReport = async (req, res) => {
  try {
    const context = await loadCopilotContext();
    const report = buildCopilotReport(context.machines);

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
