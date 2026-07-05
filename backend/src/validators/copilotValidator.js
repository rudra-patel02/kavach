const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_ITEMS = 20;

export const validateCopilotChatPayload = (payload = {}) => {
  const message = String(payload.message || "").trim();

  if (!message) {
    const error = new Error("Message is required");
    error.statusCode = 400;
    throw error;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    const error = new Error(
      `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`
    );
    error.statusCode = 400;
    throw error;
  }

  const history = Array.isArray(payload.history)
    ? payload.history
        .slice(-MAX_HISTORY_ITEMS)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          content: String(item?.content || "").slice(0, MAX_MESSAGE_LENGTH),
        }))
        .filter((item) => item.content.trim())
    : [];

  return {
    message,
    history,
    stream: Boolean(payload.stream),
  };
};
