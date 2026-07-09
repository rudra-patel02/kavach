import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCopilotReport,
  buildCopilotResponse,
} from "../src/services/copilotAnalysisService.js";

const machines = [
  {
    machineId: "M001",
    name: "Compressor-01",
    department: "Production",
    status: "Running",
    health: 96,
    temperature: 62,
    vibration: 0.22,
    power: 38,
    pressure: 1.1,
    energyConsumed: 420,
    efficiency: 95,
    aiPrediction: {
      failureRisk: "Low",
      maintenancePriority: "Low",
      maintenanceInDays: 30,
    },
  },
  {
    machineId: "M002",
    name: "Pump-03",
    department: "Utility",
    status: "Warning",
    health: 58,
    temperature: 82,
    vibration: 0.84,
    power: 74,
    pressure: 1.8,
    energyConsumed: 640,
    efficiency: 76,
    aiPrediction: {
      failureRisk: "Medium",
      maintenancePriority: "Soon",
      maintenanceInDays: 7,
    },
  },
  {
    machineId: "M003",
    name: "Boiler-02",
    department: "Boiler",
    status: "Critical",
    health: 31,
    temperature: 94,
    vibration: 1.36,
    power: 91,
    pressure: 2.4,
    energyConsumed: 980,
    efficiency: 58,
    aiPrediction: {
      failureRisk: "High",
      maintenancePriority: "Immediate",
      maintenanceInDays: 1,
    },
  },
];

test("diagnoses a referenced machine using all relevant signals", () => {
  const response = buildCopilotResponse("Why is Machine-03 overheating?", machines);

  assert.equal(response.intent, "machine_diagnosis");
  assert.equal(response.affectedMachines[0].machineId, "M003");
  assert.equal(response.recommendation.riskLevel, "Critical");
  assert.match(response.answer, /temperature/i);
  assert.match(response.answer, /Possible cause:/);
  assert.match(response.answer, /Estimated downtime:/);
});

test("returns unhealthy machines from health and status context", () => {
  const response = buildCopilotResponse("Show unhealthy machines", machines);
  const machineIds = response.affectedMachines.map((machine) => machine.machineId);

  assert.deepEqual(machineIds, ["M003", "M002"]);
  assert.match(response.answer, /Unhealthy machines found/);
});

test("builds a report payload ready for future PDF export", () => {
  const report = buildCopilotReport(machines);

  assert.equal(report.plantSummary.healthyMachines, 1);
  assert.equal(report.plantSummary.warningMachines, 1);
  assert.equal(report.plantSummary.criticalMachines, 1);
  assert.equal(report.plantSummary.highestTemperature.machineId, "M003");
  assert.equal(report.plantSummary.highestEnergyConsumption.machineId, "M003");
  assert.equal(report.maintenanceSchedule[0].machineId, "M003");
});
