import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProtocolIntegrationHealth,
  buildSmartFactoryTwin,
  buildVisionOverview,
  buildWhatIfSimulation,
  normalizeVisionPayload,
} from "../src/services/smartFactoryService.js";

const machine = {
  machineId: "M-100",
  name: "Press Line 1",
  department: "Production",
  status: "Running",
  health: 82,
  temperature: 68,
  vibration: 0.38,
  pressure: 1.2,
  power: 420,
  efficiency: 91,
};

test("buildProtocolIntegrationHealth reports MQTT, OPC UA, Modbus, and PLC readiness", () => {
  const result = buildProtocolIntegrationHealth({
    devices: [
      { deviceId: "esp32-1", protocol: "MQTT", connectionStatus: "online", healthStatus: "healthy" },
      { deviceId: "opc-1", protocol: "OPC_UA", connectionStatus: "offline", healthStatus: "offline" },
      { deviceId: "plc-1", protocol: "PLC", connectionStatus: "online", healthStatus: "healthy" },
      { deviceId: "modbus-1", protocol: "MODBUS_TCP", connectionStatus: "online", healthStatus: "warning" },
    ],
    connectionLogs: [
      { protocol: "OPC_UA", status: "error" },
      { metadata: { protocol: "MODBUS_TCP" }, status: "offline" },
    ],
  });

  assert.equal(result.summary.adaptersReady >= 6, true);
  assert.equal(result.protocols.find((item) => item.protocol === "PLC").online, 1);
  assert.equal(result.protocols.find((item) => item.protocol === "MQTT").status, "healthy");
});

test("normalizeVisionPayload validates camera events and infers severity", () => {
  const event = normalizeVisionPayload(
    {
      cameraId: "CAM-01",
      eventType: "fire",
      detections: [{ label: "flame", confidence: 93.44 }],
    },
    { tenantId: "tenant-1", plantId: "plant-1" }
  );

  assert.equal(event.cameraId, "CAM-01");
  assert.equal(event.eventType, "FIRE");
  assert.equal(event.severity, "High");
  assert.equal(event.tenantId, "tenant-1");
  assert.equal(event.detections[0].confidence, 93.4);
});

test("buildVisionOverview summarizes PPE, fire, smoke, and intrusion detections", () => {
  const overview = buildVisionOverview([
    { eventId: "1", eventType: "PPE", severity: "Medium", status: "open", observedAt: new Date() },
    { eventId: "2", eventType: "FIRE", severity: "Critical", status: "open", observedAt: new Date() },
    { eventId: "3", eventType: "SMOKE", severity: "High", status: "resolved", observedAt: new Date() },
  ]);

  assert.equal(overview.summary.totalEvents, 3);
  assert.equal(overview.summary.openEvents, 2);
  assert.equal(overview.summary.criticalEvents, 1);
  assert.equal(overview.byType.FIRE, 1);
});

test("buildWhatIfSimulation compares baseline and simulated machine risk without mutating input", () => {
  const simulation = buildWhatIfSimulation(machine, {
    name: "High temperature scenario",
    overrides: { temperature: 92, vibration: 0.9 },
  });

  assert.equal(simulation.machine.machineId, "M-100");
  assert.equal(simulation.scenario.overrides.temperature, 92);
  assert.equal(simulation.simulated.failureProbability > simulation.baseline.failureProbability, true);
  assert.equal(machine.temperature, 68);
});

test("buildSmartFactoryTwin combines machines, devices, alerts, and vision state", () => {
  const twin = buildSmartFactoryTwin({
    machines: [machine],
    devices: [
      {
        deviceId: "esp32-1",
        deviceType: "ESP32",
        machineId: "M-100",
        protocol: "MQTT",
        connectionStatus: "online",
        healthStatus: "healthy",
      },
    ],
    notifications: [{ _id: "n1", machineId: "M-100", severity: "High", title: "Hot bearing" }],
    visionEvents: [{ eventId: "v1", eventType: "INTRUSION", severity: "High", status: "open" }],
  });

  assert.equal(twin.version, "4.0");
  assert.equal(twin.summary.machines, 1);
  assert.equal(twin.summary.onlineDevices, 1);
  assert.equal(twin.nodes.some((node) => node.id === "M-100"), true);
  assert.equal(twin.vision.byType.INTRUSION, 1);
});
