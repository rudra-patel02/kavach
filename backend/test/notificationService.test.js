import assert from "node:assert/strict";
import test from "node:test";

import { buildNotificationCandidates } from "../src/services/notificationService.js";

const baseMachine = {
  machineId: "M999",
  name: "Test Machine",
  department: "QA",
  status: "Running",
  health: 92,
  temperature: 58,
  vibration: 0.2,
  pressure: 1.1,
  power: 30,
  energyConsumed: 300,
  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
    recommendation: "Machine is healthy.",
  },
};

test("does not create notification candidates for healthy telemetry", () => {
  assert.deepEqual(buildNotificationCandidates(baseMachine), []);
});

test("creates notification candidates for critical telemetry and immediate maintenance", () => {
  const candidates = buildNotificationCandidates({
    ...baseMachine,
    status: "Critical",
    health: 24,
    temperature: 98,
    vibration: 1.44,
    energyConsumed: 980,
    aiPrediction: {
      failureRisk: "High",
      maintenancePriority: "Immediate",
      maintenanceInDays: 1,
      recommendation: "Inspect immediately.",
    },
  });

  assert.equal(candidates.length, 5);
  assert.deepEqual(
    candidates.map((candidate) => candidate.type).sort(),
    [
      "failure_probability",
      "machine_health",
      "maintenance",
      "temperature",
      "vibration",
    ]
  );
  assert.ok(candidates.every((candidate) => candidate.machineId === "M999"));
});
