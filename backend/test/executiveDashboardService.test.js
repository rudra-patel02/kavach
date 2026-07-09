import assert from "node:assert/strict";
import test from "node:test";

import { calculateExecutiveDashboardKpis } from "../src/services/executiveDashboardService.js";

test("returns safe default executive KPIs when no plant data exists", () => {
  const result = calculateExecutiveDashboardKpis();

  assert.equal(result.availability, 0);
  assert.equal(result.oee, 0);
  assert.equal(result.health, 0);
  assert.equal(result.alerts, 0);
  assert.equal(result.machineSummary.totalMachines, 0);
});

test("calculates plant-wide KPI aggregation from mixed machine data", () => {
  const result = calculateExecutiveDashboardKpis({
    machines: [
      {
        machineId: "M001",
        status: "Running",
        health: 96,
        temperature: 42,
        vibration: 0.2,
        energyConsumed: 120,
        efficiency: 94,
        predictedFailureProbability: 8,
      },
      {
        machineId: "M002",
        status: "Critical",
        health: 52,
        temperature: 88,
        vibration: 1.2,
        power: 640,
        efficiency: 64,
        aiPrediction: {
          failureRisk: "High",
        },
      },
      {
        machineId: "M003",
        status: "Idle",
        health: "not-a-number",
        temperature: undefined,
        vibration: null,
        energyConsumed: 80,
        efficiency: 76,
      },
    ],
    notifications: [
      { severity: "Critical", read: false },
      { severity: "Medium", read: true },
    ],
    workOrders: [
      { status: "OPEN", estimatedDowntimeHours: 3 },
      { status: "COMPLETED", estimatedDowntimeHours: 2, updatedAt: new Date() },
    ],
  });

  assert.equal(result.machineSummary.totalMachines, 3);
  assert.equal(result.machineSummary.runningMachines, 1);
  assert.equal(result.machineSummary.idleMachines, 1);
  assert.equal(result.machineSummary.criticalMachines, 1);
  assert.equal(result.alerts, 1);
  assert.equal(result.criticalAlerts, 1);
  assert.ok(result.availability > 0);
  assert.ok(result.oee >= 0);
  assert.ok(result.risk > 0);
  assert.ok(result.safetyScore <= 100);
});
