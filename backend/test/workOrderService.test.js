import assert from "node:assert/strict";
import test from "node:test";

import { shouldCreateWorkOrderForMachine } from "../src/services/workOrderService.js";

const healthyMachine = {
  machineId: "M100",
  name: "Healthy Machine",
  department: "Production",
  status: "Running",
  health: 96,
  temperature: 52,
  vibration: 0.18,
  pressure: 1.1,
  power: 30,
  energyConsumed: 280,
  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
    recommendation: "Machine is healthy.",
  },
};

test("does not require a work order for healthy machines", () => {
  const assessment = shouldCreateWorkOrderForMachine(healthyMachine);

  assert.equal(assessment.shouldCreate, false);
  assert.deepEqual(assessment.triggers, []);
});

test("requires a work order for immediate AI maintenance and severe risk", () => {
  const assessment = shouldCreateWorkOrderForMachine({
    ...healthyMachine,
    status: "Critical",
    health: 22,
    temperature: 99,
    vibration: 1.5,
    energyConsumed: 980,
    aiPrediction: {
      failureRisk: "High",
      maintenancePriority: "Immediate",
      maintenanceInDays: 1,
      recommendation: "Inspect immediately.",
    },
  });

  assert.equal(assessment.shouldCreate, true);
  assert.match(assessment.triggers.join(" "), /Immediate/);
  assert.match(assessment.triggers.join(" "), /Failure probability/);
  assert.match(assessment.triggers.join(" "), /Machine health/);
});
