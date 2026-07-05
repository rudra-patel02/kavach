import Machine from "../models/machine.js";
import { createNotificationsForMachines } from "./notificationService.js";
import {
  buildPredictiveOverview,
  createMachinePrediction,
} from "./predictionService.js";
import { createWorkOrdersForMachines } from "./workOrderService.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const randomBetween = (rng, min, max) => rng() * (max - min) + min;

const numeric = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const smooth = (current, target, factor = 0.22) =>
  current + (target - current) * factor;

const getRiskStress = (machine) => {
  const healthRisk = clamp((100 - numeric(machine.health, 90)) / 100, 0, 1);
  const temperatureRisk = clamp((numeric(machine.temperature, 45) - 65) / 40, 0, 1);
  const vibrationRisk = clamp((numeric(machine.vibration, 0.25) - 0.45) / 1.1, 0, 1);
  const pressure = numeric(machine.pressure, 1.1);
  const pressureRisk =
    pressure < 0.75
      ? clamp((0.75 - pressure) / 0.3, 0, 1)
      : clamp((pressure - 1.8) / 0.7, 0, 1);
  const powerRisk = clamp((numeric(machine.power, 180) - 500) / 500, 0, 1);

  return clamp(
    healthRisk * 0.34 +
      temperatureRisk * 0.18 +
      vibrationRisk * 0.2 +
      pressureRisk * 0.12 +
      powerRisk * 0.16,
    0,
    1
  );
};

const getStatus = ({ health, failureProbability }) => {
  if (health <= 25 || failureProbability >= 78) return "Critical";
  if (health <= 58 || failureProbability >= 45) return "Warning";
  return "Running";
};

const toLegacyAiPrediction = (prediction) => ({
  failureRisk:
    prediction.riskLevel === "Critical" || prediction.riskLevel === "High"
      ? "High"
      : prediction.riskLevel === "Medium"
        ? "Medium"
        : "Low",
  maintenancePriority: prediction.maintenancePriority,
  maintenanceInDays: Math.max(
    1,
    Math.ceil(prediction.remainingUsefulLifeHours / 24)
  ),
  recommendation: prediction.recommendation,
});

export const simulateMachineTelemetry = (
  machine,
  { intervalMs = 2000, rng = Math.random } = {}
) => {
  const stress = getRiskStress(machine);
  const previousTemperature = numeric(machine.temperature, 42);
  const previousVibration = numeric(machine.vibration, 0.22);
  const previousPressure = numeric(machine.pressure, 1.1);
  const previousHumidity = numeric(machine.humidity, 45);
  const previousPower = numeric(machine.power, 180);
  const previousHealth = numeric(machine.health, 94);
  const previousEfficiency = numeric(machine.efficiency, 91);
  const previousDowntime = numeric(machine.downtime, 0);
  const previousEnergy = numeric(machine.energyConsumed, previousPower);
  const intervalHours = intervalMs / 3600000;

  const targetTemperature = 42 + stress * 55 + randomBetween(rng, -3.5, 3.5);
  const temperature = round(
    clamp(smooth(previousTemperature, targetTemperature, 0.24), 22, 112),
    1
  );
  const vibration = round(
    clamp(
      smooth(
        previousVibration,
        0.18 + stress * 1.28 + randomBetween(rng, -0.07, 0.08),
        0.26
      ),
      0.02,
      2.4
    ),
    2
  );
  const pressure = round(
    clamp(
      smooth(
        previousPressure,
        1.05 + stress * 0.92 + randomBetween(rng, -0.12, 0.12),
        0.22
      ),
      0.4,
      2.8
    ),
    2
  );
  const humidity = round(
    clamp(previousHumidity + randomBetween(rng, -2.6, 2.6), 28, 78),
    1
  );
  const power = round(
    clamp(
      smooth(previousPower, 210 + stress * 780 + randomBetween(rng, -45, 45), 0.18),
      25,
      1150
    ),
    1
  );
  const voltage = round(
    clamp(415 - stress * 14 + randomBetween(rng, -7, 7), 380, 440),
    1
  );
  const current = round(
    clamp((power * 1000) / (Math.sqrt(3) * voltage * 0.88), 8, 1800),
    1
  );
  const efficiency = round(
    clamp(
      smooth(
        previousEfficiency,
        95 - stress * 39 + randomBetween(rng, -2.4, 2.2),
        0.22
      ),
      45,
      99
    ),
    1
  );
  const health = round(
    clamp(
      smooth(
        previousHealth,
        98 - stress * 72 - randomBetween(rng, 0, 2.4),
        0.16
      ),
      0,
      100
    ),
    1
  );
  const rpm = Math.round(
    clamp(
      smooth(numeric(machine.rpm, 1450), 1480 - stress * 210 + randomBetween(rng, -35, 35), 0.18),
      600,
      1800
    )
  );
  const predictedMachine = {
    ...machine,
    health,
    temperature,
    vibration,
    pressure,
    power,
    efficiency,
  };
  const prediction = createMachinePrediction(predictedMachine);
  const downtimeIncrement =
    prediction.riskLevel === "Critical"
      ? intervalHours * 1.8
      : prediction.riskLevel === "High"
        ? intervalHours * 0.65
        : prediction.riskLevel === "Medium"
          ? intervalHours * 0.15
          : 0;
  const availability =
    prediction.riskLevel === "Critical"
      ? 82
      : prediction.riskLevel === "High"
        ? 91
        : prediction.riskLevel === "Medium"
          ? 96
          : 99;
  const quality = clamp(99 - prediction.failureProbability * 0.11 - vibration * 2.2, 82, 99.5);
  const oee = round((availability / 100) * (efficiency / 100) * (quality / 100) * 100, 1);

  return {
    temperature,
    vibration,
    pressure,
    humidity,
    power,
    current,
    voltage,
    health,
    efficiency,
    rpm,
    energyConsumed: round(previousEnergy + power * intervalHours, 2),
    downtime: round(previousDowntime + downtimeIncrement, 3),
    oee,
    remainingUsefulLifeHours: prediction.remainingUsefulLifeHours,
    predictedFailureProbability: prediction.failureProbability,
    status: getStatus({
      health,
      failureProbability: prediction.failureProbability,
    }),
  };
};

const appendPredictionHistory = (machine, prediction) => {
  machine.predictionHistory = [
    ...(Array.isArray(machine.predictionHistory) ? machine.predictionHistory : []),
    {
      timestamp: new Date(),
      failureProbability: prediction.failureProbability,
      remainingUsefulLifeHours: prediction.remainingUsefulLifeHours,
      maintenancePriority: prediction.maintenancePriority,
      riskLevel: prediction.riskLevel,
      confidenceScore: prediction.aiConfidence,
    },
  ].slice(-50);
};

const buildAiInsights = (predictiveOverview) => ({
  generatedAt: new Date().toISOString(),
  insights: predictiveOverview.recommendations.map((item) => ({
    machineId: item.machineId,
    title: item.title,
    riskLevel: item.riskLevel,
    recommendation: item.recommendation,
  })),
});

export const startSensorSimulation = (gateway, intervalMs = 2000) => {
  let stopped = false;
  let timer;

  const runSimulation = async () => {
    try {
      const machines = await Machine.find();

      for (const machine of machines) {
        Object.assign(
          machine,
          simulateMachineTelemetry(machine.toObject(), { intervalMs })
        );
        machine.lastHeartbeat = new Date();
        const prediction = createMachinePrediction(machine.toObject());
        machine.aiPrediction = toLegacyAiPrediction(prediction);
        machine.remainingUsefulLifeHours = prediction.remainingUsefulLifeHours;
        machine.predictedFailureProbability = prediction.failureProbability;
        appendPredictionHistory(machine, prediction);

        await machine.save();
      }

      const updatedMachines = await Machine.find();
      await createNotificationsForMachines(updatedMachines, gateway);
      await createWorkOrdersForMachines(updatedMachines, gateway);
      const machinePayload = updatedMachines.map((machine) => machine.toObject());
      const predictiveOverview = buildPredictiveOverview(machinePayload);
      const aiInsights = buildAiInsights(predictiveOverview);

      if (gateway?.broadcastMachineSnapshot) {
        gateway.broadcastMachineSnapshot(machinePayload, {
          predictiveOverview,
          aiInsights,
        });
      } else if (gateway?.emit) {
        gateway.emit("machineUpdate", machinePayload);
        gateway.emit("predictive:overview", predictiveOverview);
        gateway.emit("ai:insights", aiInsights);
      }
    } catch (error) {
      console.error("Sensor simulation failed:", error.message);
    } finally {
      if (!stopped) {
        timer = setTimeout(runSimulation, intervalMs);
      }
    }
  };

  timer = setTimeout(runSimulation, intervalMs);

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
};
