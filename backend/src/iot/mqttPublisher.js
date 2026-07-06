import { randomUUID } from "node:crypto";

import { DEFAULT_MQTT_QOS, getDeviceTopic } from "./mqttTopics.js";

const publishAsync = (client, topic, payload, options) =>
  new Promise((resolve, reject) => {
    if (!client) {
      reject(new Error("MQTT client is not connected"));
      return;
    }

    client.publish(topic, JSON.stringify(payload), options, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        options,
        payload,
        topic,
      });
    });
  });

export const createMqttPublisher = (clientManager) => {
  const publish = (topic, payload, options = {}) =>
    publishAsync(clientManager.getClient(), topic, payload, {
      qos: options.qos ?? DEFAULT_MQTT_QOS,
      retain: Boolean(options.retain),
    });

  return {
    publish,
    publishDeviceCommand(deviceId, command, options = {}) {
      return publish(
        getDeviceTopic(deviceId, "command"),
        {
          command,
          correlationId: options.correlationId || randomUUID(),
          issuedAt: new Date().toISOString(),
          payload: options.payload || {},
        },
        {
          qos: options.qos ?? DEFAULT_MQTT_QOS,
          retain: Boolean(options.retain),
        }
      );
    },
    publishDeviceConfig(deviceId, config, options = {}) {
      return publish(
        getDeviceTopic(deviceId, "command"),
        {
          command: "CONFIG_UPDATE",
          config,
          issuedAt: new Date().toISOString(),
        },
        {
          qos: options.qos ?? DEFAULT_MQTT_QOS,
          retain: options.retain ?? true,
        }
      );
    },
  };
};
