import mqtt from "mqtt";
import { EventEmitter } from "node:events";

const parseNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const getMqttConfig = () => ({
  brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://mqtt:1883",
  clientId:
    process.env.MQTT_CLIENT_ID ||
    `kavach-backend-${process.pid}-${Date.now().toString(36)}`,
  keepalive: parseNumber(process.env.MQTT_KEEPALIVE, 60),
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: parseNumber(process.env.MQTT_RECONNECT_MS, 2000),
  username: process.env.MQTT_USERNAME,
});

export const createMqttClientManager = () => {
  const events = new EventEmitter();
  let client = null;
  let connected = false;
  let started = false;

  const getStatus = () => ({
    brokerUrl: getMqttConfig().brokerUrl,
    clientId: getMqttConfig().clientId,
    connected,
    started,
  });

  const start = async () => {
    if (client) {
      return getStatus();
    }

    const config = getMqttConfig();
    started = true;
    client = mqtt.connect(config.brokerUrl, {
      clean: true,
      clientId: config.clientId,
      connectTimeout: 10000,
      keepalive: config.keepalive,
      password: config.password,
      reconnectPeriod: config.reconnectPeriod,
      username: config.username,
    });

    client.on("connect", () => {
      connected = true;
      events.emit("connect", getStatus());
    });

    client.on("reconnect", () => {
      events.emit("reconnect", getStatus());
    });

    client.on("close", () => {
      connected = false;
      events.emit("close", getStatus());
    });

    client.on("offline", () => {
      connected = false;
      events.emit("offline", getStatus());
    });

    client.on("error", (error) => {
      events.emit("error", error);
    });

    return getStatus();
  };

  const stop = async () => {
    started = false;

    if (!client) {
      return getStatus();
    }

    const activeClient = client;
    client = null;

    await new Promise((resolve) => {
      activeClient.end(false, {}, resolve);
    });

    connected = false;
    return getStatus();
  };

  return {
    events,
    getClient: () => client,
    getStatus,
    start,
    stop,
  };
};
