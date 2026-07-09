import assert from "node:assert/strict";
import test from "node:test";

import { getDeviceTopic, parseDeviceTopic } from "../src/iot/mqttTopics.js";

test("parses supported MQTT device topics", () => {
  assert.deepEqual(parseDeviceTopic("kavach/device/register"), {
    channel: "register",
    deviceId: null,
    isValid: true,
  });
  assert.deepEqual(parseDeviceTopic("kavach/device/esp32-001/telemetry"), {
    channel: "telemetry",
    deviceId: "esp32-001",
    isValid: true,
  });
  assert.equal(
    getDeviceTopic("esp32-001", "command"),
    "kavach/device/esp32-001/command"
  );
});

test("rejects invalid MQTT topic roots", () => {
  assert.equal(parseDeviceTopic("other/device/esp32/telemetry").isValid, false);
});
