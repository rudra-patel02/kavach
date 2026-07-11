import { authenticatedFetch, fetchJson } from "./api";
import type {
  CopilotChatResponse,
  CopilotReportResponse,
  CopilotStreamEvent,
} from "@/types/copilot";

export const sendCopilotMessage = (message: string) =>
  fetchJson<CopilotChatResponse>("/api/copilot/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

export const streamCopilotMessage = async (
  message: string,
  onEvent: (event: CopilotStreamEvent) => void,
  history: { content: string; role: "assistant" | "user" }[] = []
) => {
  const response = await authenticatedFetch("/api/copilot/chat", {
    method: "POST",
    headers: {
      "Accept": "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      history,
      message,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Copilot stream unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const eventName = eventBlock.match(/^event:\s*(.+)$/m)?.[1];
      const data = eventBlock.match(/^data:\s*(.+)$/m)?.[1];

      if (!eventName || !data) {
        continue;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      if (eventName === "token") {
        const payload = parsed as { token?: string };
        onEvent({ type: "token", token: payload.token || "" });
      } else if (eventName === "done") {
        onEvent({ type: "done", response: parsed as CopilotChatResponse });
      } else if (eventName === "meta") {
        onEvent({ type: "meta", response: parsed as Partial<CopilotChatResponse> });
      }
    }
  }
};

export const fetchCopilotReport = () =>
  fetchJson<CopilotReportResponse>("/api/copilot/report");
