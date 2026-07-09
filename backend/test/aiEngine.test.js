import assert from "node:assert/strict";
import test from "node:test";

import { analyzeAnomalies } from "../src/services/AnomalyService.js";
import { buildMachineIntelligence } from "../src/services/AIEngine.js";
import { forecastFailures } from "../src/services/ForecastService.js";
import { generateMaintenancePlan } from "../src/services/PlannerService.js";
import { analyzeRootCauses } from "../src/services/RootCauseService.js";
import { estimateRUL } from "../src/services/RULService.js";

const history = [];

for (let index = 0; index < 16; index += 1) {
  const timestamp = new Date(Date.UTC(2026, 6, 6, 0, index, 0));
  history.push(
    { machineId: "M-AI-1", sensor: "temperature", value: 48 + index * 0.1, timestamp },
    { machineId: "M-AI-1", sensor: "vibration", value: 0.22 + index * 0.005, timestamp },
    { machineId: "M-AI-1", sensor: "current", value: 120 + index, timestamp },
    { machineId: "M-AI-1", sensor: "pressure", value: 1.1, timestamp },
    { machineId: "M-AI-1", sensor: "voltage", value: 415, timestamp },
    { machineId: "M-AI-1", sensor: "rpm", value: 1450, timestamp },
    { machineId: "M-AI-1", sensor: "energy", value: 260 + index, timestamp },
    { machineId: "M-AI-1", sensor: "oilLevel", value: 88 - index * 0.1, timestamp },
    { machineId: "M-AI-1", sensor: "humidity", value: 44, timestamp }
  );
}

const criticalTelemetry = {
  temperature: 102,
  vibration: 1.82,
  pressure: 2.35,
  voltage: 372,
  current: 940,
  rpm: 1120,
  energy: 1120,
  oilLevel: 24,
  humidity: 82,
};

const machine = {
  machineId: "M-AI-1",
  name: "AI Compressor",
  department: "Utilities",
  status: "Warning",
  health: 72,
  maintenanceHistory: [],
  createdAt: "2026-05-01T00:00:00.000Z",
  ...criticalTelemetry,
};

test("detects multi-sensor anomalies with dynamic thresholds and z-scores", () => {
  const historyBySensor = history.reduce((acc, item) => {
    acc[item.sensor] = acc[item.sensor] || [];
    acc[item.sensor].push({ value: item.value, timestamp: item.timestamp });
    return acc;
  }, {});
  const anomaly = analyzeAnomalies({
    telemetry: criticalTelemetry,
    historyBySensor,
    timestamp: "2026-07-06T01:00:00.000Z",
  });

  assert.equal(anomaly.anomaly, true);
  assert.match(anomaly.severity, /High|Critical/);
  assert.ok(anomaly.confidence >= 80);
  assert.ok(anomaly.sensors.some((sensor) => sensor.sensor === "vibration"));
  assert.ok(anomaly.zScores.temperature > 3);
  assert.ok(anomaly.spikeDetections.includes("vibration"));
});

test("explains likely root causes and generates RUL/forecast/planner outputs", () => {
  const anomaly = analyzeAnomalies({
    telemetry: criticalTelemetry,
    historyBySensor: {},
  });
  const rootCause = analyzeRootCauses({
    telemetry: criticalTelemetry,
    anomaly,
    machine,
  });
  const rul = estimateRUL({
    machine,
    telemetry: criticalTelemetry,
    anomaly,
    rootCause,
  });
  const forecast = forecastFailures({
    telemetry: criticalTelemetry,
    anomaly,
    rootCause,
    rul,
  });
  const plan = generateMaintenancePlan({
    machine,
    anomaly,
    rootCause,
    rul,
    forecast,
  });

  assert.ok(rootCause.causes.length >= 3);
  assert.ok(rootCause.causes[0].probability > 20);
  assert.ok(rul.remainingHours > 0);
  assert.ok(rul.riskPercent >= 50);
  assert.equal(forecast.horizons.length, 3);
  assert.ok(forecast.probabilityChart[2].bearingFailure >= forecast.probabilityChart[0].bearingFailure);
  assert.match(plan.priority, /Immediate|High|Planned/);
  assert.ok(plan.requiredSpareParts.length > 0);
});

test("builds complete machine intelligence without database persistence", async () => {
  const intelligence = await buildMachineIntelligence(machine, {
    metrics: criticalTelemetry,
    sensorHistory: history,
    timestamp: "2026-07-06T01:00:00.000Z",
  });

  assert.equal(intelligence.machine.machineId, "M-AI-1");
  assert.equal(intelligence.anomaly.anomaly, true);
  assert.equal(intelligence.forecast.horizons.length, 3);
  assert.ok(intelligence.maintenancePlan.estimatedCost > 0);
  assert.ok(intelligence.recommendations.length > 0);
  assert.equal(
    intelligence.machineSummary.failureProbability,
    intelligence.forecast.peakProbability
  );
});
