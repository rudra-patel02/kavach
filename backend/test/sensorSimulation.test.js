import assert from "node:assert/strict";
import test from "node:test";

import { simulateMachineTelemetry } from "../src/services/SensorService.js";

const baseMachine = {
  machineId: "M200",
  name: "Simulator Test",
  department: "QA",
  status: "Running",
  health: 91,
  temperature: 54,
  vibration: 0.28,
  pressure: 1.1,
  humidity: 45,
  power: 220,
  current: 310,
  voltage: 415,
  energyConsumed: 420,
  efficiency: 92,
  rpm: 1480,
  downtime: 0,
  oee: 91,
  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
  },
};

test("simulates bounded industrial telemetry and derived reliability metrics", () => {
  const values = [0.5, 0.62, 0.38, 0.71, 0.43, 0.57, 0.49, 0.66, 0.34];
  let index = 0;
  const rng = () => values[index++ % values.length];
  const telemetry = simulateMachineTelemetry(baseMachine, {
    intervalMs: 2000,
    rng,
  });

  assert.ok(telemetry.temperature >= 22 && telemetry.temperature <= 112);
  assert.ok(telemetry.vibration >= 0.02 && telemetry.vibration <= 2.4);
  assert.ok(telemetry.pressure >= 0.4 && telemetry.pressure <= 2.8);
  assert.ok(telemetry.current > 0);
  assert.ok(telemetry.voltage >= 380 && telemetry.voltage <= 440);
  assert.ok(telemetry.energyConsumed > baseMachine.energyConsumed);
  assert.ok(telemetry.remainingUsefulLifeHours > 0);
  assert.ok(telemetry.predictedFailureProbability >= 0);
  assert.ok(telemetry.oee >= 0 && telemetry.oee <= 100);
  assert.match(telemetry.status, /Running|Warning|Critical/);
});
