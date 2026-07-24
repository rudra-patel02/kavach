import { markStaleDevicesOffline } from "./deviceRegistry.js";
import { startDeviceHeartbeatMonitor } from "./deviceHeartbeat.js";
import { createMqttClientManager } from "./mqttClient.js";
import { createMqttPublisher } from "./mqttPublisher.js";
import { createMqttSubscriber } from "./mqttSubscriber.js";
import { createProtocolAdapters } from "./protocolAdapters.js";

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const logIoTInfo = (message, metadata = {}) => {
  console.info(
    JSON.stringify({
      level: "info",
      message,
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  );
};

export const createIoTConnectionManager = ({ gateway }) => {
  const mqttClientManager = createMqttClientManager();
  const mqttPublisher = createMqttPublisher(mqttClientManager);
  const mqttSubscriber = createMqttSubscriber({
    clientManager: mqttClientManager,
    gateway,
  });
  const adapters = createProtocolAdapters(mqttClientManager);
  let stopHeartbeatMonitor = null;
  let mqttEnabled = false;

  mqttClientManager.events.on("connect", async (status) => {
    logIoTInfo("mqtt_connected", { brokerUrl: status.brokerUrl });

    try {
      await mqttSubscriber.subscribe();
    } catch (error) {
      console.error("MQTT subscription failed:", error.message);
    }
  });

  mqttClientManager.events.on("reconnect", () => {
    logIoTInfo("mqtt_reconnecting");
  });

  mqttClientManager.events.on("offline", () => {
    console.warn("MQTT offline");
  });

  mqttClientManager.events.on("error", (error) => {
    console.error("MQTT error:", error.message);
  });

  const start = async () => {
    stopHeartbeatMonitor = startDeviceHeartbeatMonitor({
      gateway,
      markOffline: markStaleDevicesOffline,
    });
    mqttEnabled = parseBoolean(process.env.IOT_ENABLED, false);

    if (mqttEnabled) {
      await mqttClientManager.start();
    } else {
      logIoTInfo("mqtt_disabled_rest_device_api_enabled");
    }

    return {
      adapters: Object.keys(adapters),
      mqtt: mqttClientManager.getStatus(),
      mqttEnabled,
    };
  };

  const stop = async () => {
    if (stopHeartbeatMonitor) {
      stopHeartbeatMonitor();
      stopHeartbeatMonitor = null;
    }

    await mqttClientManager.stop();
  };

  return {
    adapters,
    mqttClientManager,
    mqttPublisher,
    start,
    stop,
  };
};
