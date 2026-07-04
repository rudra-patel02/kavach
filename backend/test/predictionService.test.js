import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPredictiveOverview,
  createMachinePrediction,
} from "../src/services/predictionService.js";

const healthyMachine = {
  machineId: "M001",
  name: "Compressor-01",
  department: "Production",
  status: "Running",
  health: 96,
  temperature: 58,
  vibration: 0.22,
  pressure: 1.1,
  energyConsumed: 380,
  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
  },
};

const criticalMachine = {
  machineId: "M003",
  name: "Boiler-02",
  department: "Boiler",
  status: "Critical",
  health: 29,
  temperature: 96,
  vibration: 1.42,
  pressure: 2.4,
  energyConsumed: 990,
  aiPrediction: {
    failureRisk: "High",
    maintenancePriority: "Immediate",
    maintenanceInDays: 1,
  },
};

test("creates low-risk predictions for healthy machines", () => {
  const prediction = createMachinePrediction(healthyMachine);

  assert.equal(prediction.riskLevel, "Low");
  assert.equal(prediction.maintenancePriority, "Monitor");
  assert.ok(prediction.remainingUsefulLifeHours > 120);
  assert.ok(prediction.aiConfidence >= 80);
});

test("creates critical predictions from severe telemetry and AI prediction", () => {
  const prediction = createMachinePrediction(criticalMachine);

  assert.equal(prediction.riskLevel, "Critical");
  assert.equal(prediction.maintenancePriority, "Immediate");
  assert.ok(prediction.failureProbability >= 78);
  assert.ok(prediction.remainingUsefulLifeHours <= 48);
});

test("builds dashboard-ready predictive overview", () => {
  const overview = buildPredictiveOverview([healthyMachine, criticalMachine]);

  assert.equal(overview.summary.totalMachines, 2);
  assert.equal(overview.summary.highRiskMachines, 1);
  assert.equal(overview.predictions[0].machineId, "M003");
  assert.equal(overview.ranking[0].rank, 1);
  assert.equal(overview.trends.temperature.length, 6);
  assert.equal(overview.maintenanceCalendar[0].machineId, "M003");
  assert.equal(overview.recommendations[0].machineId, "M003");
});
