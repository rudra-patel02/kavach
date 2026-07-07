import { ingestTelemetry } from "../services/ingest.js";

// Telemetry topics look like:  kavach/devices/<deviceId>/telemetry
// The last segment is the channel; the segment before it is the device id.
export const parseDeviceTopic = (topic = "") => {
  const parts = String(topic).split("/").filter(Boolean);
  const channel = parts[parts.length - 1] || "";
  const deviceId = parts.length >= 2 ? parts[parts.length - 2] : "";
  return { deviceId, channel };
};

const parsePayload = (message) => {
  if (message && typeof message === "object" && !Buffer.isBuffer(message)) {
    return message;
  }

  try {
    return JSON.parse(Buffer.isBuffer(message) ? message.toString("utf8") : String(message));
  } catch {
    const error = new Error("MQTT payload must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
};

// Handle one inbound MQTT message. Authentication (the device shared-secret in
// the payload) is enforced inside ingestTelemetry, which fails closed — so a
// bad/missing secret rejects before anything is persisted. Directly callable in
// tests without a broker.
export const handleMqttMessage = async (topic, message) => {
  const { deviceId, channel } = parseDeviceTopic(topic);
  const payload = parsePayload(message);

  // Part 2 only ingests the telemetry channel; other channels are ignored.
  if (channel && channel !== "telemetry") {
    return null;
  }

  const { deviceSecret, ...clean } = payload;

  return ingestTelemetry(
    { ...clean, deviceId: clean.deviceId || deviceId },
    { source: "device", deviceSecret }
  );
};

const TELEMETRY_TOPIC = "kavach/devices/+/telemetry";

// Wire the handler onto a connected mqtt client (used by index.js in non-test
// runs). Errors are logged, never thrown into the client's event loop.
export const attachMqttIngest = (client, topic = TELEMETRY_TOPIC) => {
  client.on("message", (msgTopic, message) => {
    handleMqttMessage(msgTopic, message).catch((error) => {
      console.error(`MQTT ingest failed on ${msgTopic}:`, error.message);
    });
  });

  client.subscribe(topic, { qos: 1 }, (error) => {
    if (error) {
      console.error("MQTT telemetry subscribe failed:", error.message);
    }
  });

  return () => client.unsubscribe(topic);
};
