import assert from "node:assert/strict";
import test from "node:test";

import { validateCopilotChatPayload } from "../src/validators/copilotValidator.js";

test("validates copilot messages and keeps bounded history", () => {
  const payload = validateCopilotChatPayload({
    history: Array.from({ length: 25 }, (_, index) => ({
      content: `Message ${index}`,
      role: index % 2 === 0 ? "assistant" : "user",
    })),
    message: " Explain OEE ",
    stream: true,
  });

  assert.equal(payload.message, "Explain OEE");
  assert.equal(payload.stream, true);
  assert.equal(payload.history.length, 20);
  assert.equal(payload.history[0].content, "Message 5");
});

test("rejects empty copilot messages", () => {
  assert.throws(
    () => validateCopilotChatPayload({ message: "   " }),
    /Message is required/
  );
});
