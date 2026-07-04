import { fetchJson } from "./api";
import type {
  CopilotChatResponse,
  CopilotReportResponse,
} from "@/types/copilot";

export const sendCopilotMessage = (message: string) =>
  fetchJson<CopilotChatResponse>("/api/copilot/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

export const fetchCopilotReport = () =>
  fetchJson<CopilotReportResponse>("/api/copilot/report");
