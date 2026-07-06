export const MQTT_TOPICS = {
  REGISTER: "kavach/device/register",
  HEARTBEAT: "kavach/device/+/heartbeat",
  TELEMETRY: "kavach/device/+/telemetry",
  ALERTS: "kavach/device/+/alerts",
  STATUS: "kavach/device/+/status",
  COMMAND: "kavach/device/+/command",
  RESPONSE: "kavach/device/+/response",
};

export const MQTT_SUBSCRIPTIONS = [
  MQTT_TOPICS.REGISTER,
  MQTT_TOPICS.HEARTBEAT,
  MQTT_TOPICS.TELEMETRY,
  MQTT_TOPICS.ALERTS,
  MQTT_TOPICS.STATUS,
  MQTT_TOPICS.RESPONSE,
];

export const DEFAULT_MQTT_QOS = 1;

export const getDeviceTopic = (deviceId, channel) =>
  `kavach/device/${encodeURIComponent(String(deviceId))}/${channel}`;

export const parseDeviceTopic = (topic = "") => {
  const parts = String(topic).split("/");

  if (parts[0] !== "kavach" || parts[1] !== "device") {
    return {
      channel: "unknown",
      deviceId: null,
      isValid: false,
    };
  }

  if (parts[2] === "register") {
    return {
      channel: "register",
      deviceId: null,
      isValid: parts.length === 3,
    };
  }

  return {
    channel: parts[3] || "unknown",
    deviceId: parts[2] ? decodeURIComponent(parts[2]) : null,
    isValid: Boolean(parts[2] && parts[3]),
  };
};
