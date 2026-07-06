import { processDeviceHeartbeat } from "./deviceHeartbeat.js";
import { registerDevice } from "./deviceRegistry.js";
import { processTelemetryPacket } from "./telemetryProcessor.js";
import {
  DEFAULT_MQTT_QOS,
  MQTT_SUBSCRIPTIONS,
  parseDeviceTopic,
} from "./mqttTopics.js";

const parseJsonPayload = (message) => {
  try {
    return JSON.parse(message.toString("utf8"));
  } catch {
    const error = new Error("MQTT payload must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
};

const assertMqttDeviceSecret = (payload) => {
  if (!process.env.DEVICE_SECRET) {
    return;
  }

  if (payload.deviceSecret !== process.env.DEVICE_SECRET) {
    const error = new Error("MQTT device authentication failed");
    error.statusCode = 401;
    throw error;
  }
};

export const createMqttSubscriber = ({ clientManager, gateway }) => {
  let attachedClient = null;

  const handleMessage = async (topic, message) => {
    const parsedTopic = parseDeviceTopic(topic);
    const payload = parseJsonPayload(message);

    assertMqttDeviceSecret(payload);

    if (!parsedTopic.isValid) {
      return;
    }

    if (parsedTopic.channel === "register") {
      const device = await registerDevice(payload, { source: "mqtt" });
      gateway?.emit?.("device:online", device);
      return;
    }

    if (parsedTopic.channel === "heartbeat") {
      await processDeviceHeartbeat(parsedTopic.deviceId, payload, {
        gateway,
        source: "mqtt",
      });
      return;
    }

    if (parsedTopic.channel === "telemetry") {
      await processTelemetryPacket(
        {
          ...payload,
          deviceId: payload.deviceId || parsedTopic.deviceId,
        },
        {
          gateway,
          source: "mqtt",
        }
      );
      return;
    }

    if (["alerts", "response", "status"].includes(parsedTopic.channel)) {
      gateway?.emit?.(`device:${parsedTopic.channel}`, {
        deviceId: parsedTopic.deviceId,
        payload,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const subscribe = async () => {
    const client = clientManager.getClient();

    if (!client) {
      throw new Error("MQTT client is not connected");
    }

    if (attachedClient !== client) {
      client.on("message", (topic, message) => {
        handleMessage(topic, message).catch((error) => {
          console.error(`MQTT message failed on ${topic}:`, error.message);
        });
      });
      attachedClient = client;
    }

    await new Promise((resolve, reject) => {
      client.subscribe(
        MQTT_SUBSCRIPTIONS,
        { qos: DEFAULT_MQTT_QOS },
        (error, granted) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(granted);
        }
      );
    });
  };

  return {
    handleMessage,
    subscribe,
  };
};
