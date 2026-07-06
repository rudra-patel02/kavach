import assert from "node:assert/strict";
import test from "node:test";

import { validateTelemetryPayload } from "../src/iot/telemetryProcessor.js";

test("validates and normalizes industrial telemetry payloads", () => {
  const payload = validateTelemetryPayload({
    current: 8.5,
    deviceId: "esp32-001",
    energy: 1267,
    humidity: 38,
    machineId: "M-101",
    pressure: 5.2,
    temperature: 62.4,
    timestamp: "2026-07-06T00:00:00.000Z",
    vibration: 1.6,
    voltage: 229,
  });

  assert.equal(payload.deviceId, "esp32-001");
  assert.equal(payload.machineId, "M-101");
  assert.equal(payload.metrics.temperature, 62.4);
  assert.equal(payload.metrics.vibration, 1.6);
  assert.equal(payload.timestamp.toISOString(), "2026-07-06T00:00:00.000Z");
});

test("rejects telemetry payloads with invalid sensor ranges", () => {
  assert.throws(
    () =>
      validateTelemetryPayload({
        deviceId: "esp32-001",
        machineId: "M-101",
        temperature: 500,
      }),
    /temperature must be between/
  );
});
