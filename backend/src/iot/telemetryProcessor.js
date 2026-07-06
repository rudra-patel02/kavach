import Machine from "../models/machine.js";
import SensorHistory from "../models/sensorHistory.js";
import Telemetry from "../models/telemetry.js";
import { createNotificationsForMachines } from "../services/notificationService.js";
import { runRealtimeAI } from "../services/AIEngine.js";
import {
  buildPredictiveOverview,
  createMachinePrediction,
} from "../services/predictionService.js";
import {
  appendPredictionHistory,
  toLegacyAiPrediction,
} from "../services/SensorService.js";
import { createWorkOrdersForMachines } from "../services/workOrderService.js";
import { recordTelemetrySeen, registerDevice } from "./deviceRegistry.js";

const SENSOR_LIMITS = {
  current: { max: 5000, min: 0, unit: "A" },
  energy: { max: 1000000000, min: 0, unit: "kWh" },
  flowRate: { max: 100000, min: 0, unit: "L/min" },
  gasSensor: { max: 100000, min: 0, unit: "ppm" },
  humidity: { max: 100, min: 0, unit: "%" },
  noise: { max: 200, min: 0, unit: "dB" },
  oilLevel: { max: 100, min: 0, unit: "%" },
  power: { max: 100000, min: 0, unit: "kW" },
  pressure: { max: 100, min: 0, unit: "bar" },
  rpm: { max: 50000, min: 0, unit: "rpm" },
  temperature: { max: 200, min: -40, unit: "C" },
  vibration: { max: 100, min: 0, unit: "mm/s" },
  voltage: { max: 1000, min: 0, unit: "V" },
};

const MACHINE_FIELD_MAP = {
  current: "current",
  energy: "energyConsumed",
  flowRate: "flowRate",
  gasSensor: "gasSensor",
  humidity: "humidity",
  noise: "noise",
  oilLevel: "oilLevel",
  power: "power",
  pressure: "pressure",
  rpm: "rpm",
  temperature: "temperature",
  vibration: "vibration",
  voltage: "voltage",
};

const round = (value, digits = 2) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return Number(number.toFixed(digits));
};

const getMachineStatus = ({ failureProbability, health }) => {
  if (health <= 25 || failureProbability >= 78) return "Critical";
  if (health <= 58 || failureProbability >= 45) return "Warning";
  return "Running";
};

const getTelemetryHealth = (metrics, prediction) => {
  const temperatureStress = Math.max(0, Number(metrics.temperature || 0) - 70) * 0.25;
  const vibrationStress = Math.max(0, Number(metrics.vibration || 0) - 0.6) * 12;
  const oilStress = Math.max(0, 65 - Number(metrics.oilLevel ?? 100)) * 0.35;
  const noiseStress = Math.max(0, Number(metrics.noise || 0) - 85) * 0.2;
  const failureStress = Number(prediction.failureProbability || 0) * 0.35;

  return Math.max(
    0,
    Math.min(100, round(100 - temperatureStress - vibrationStress - oilStress - noiseStress - failureStress, 1))
  );
};

export const validateTelemetryPayload = (payload = {}) => {
  const errors = [];
  const deviceId = String(payload.deviceId || "").trim();
  const machineId = String(payload.machineId || "").trim();
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
  const metrics = {};

  if (!deviceId) {
    errors.push("deviceId is required");
  }

  if (!machineId) {
    errors.push("machineId is required");
  }

  if (Number.isNaN(timestamp.getTime())) {
    errors.push("timestamp must be a valid ISO8601 value");
  }

  for (const [sensor, limits] of Object.entries(SENSOR_LIMITS)) {
    if (payload[sensor] === undefined || payload[sensor] === null || payload[sensor] === "") {
      continue;
    }

    const value = Number(payload[sensor]);

    if (!Number.isFinite(value)) {
      errors.push(`${sensor} must be numeric`);
      continue;
    }

    if (value < limits.min || value > limits.max) {
      errors.push(`${sensor} must be between ${limits.min} and ${limits.max}`);
      continue;
    }

    metrics[sensor] = round(value, sensor === "vibration" || sensor === "pressure" ? 3 : 2);
  }

  if (Object.keys(metrics).length === 0) {
    errors.push("at least one supported sensor value is required");
  }

  if (errors.length > 0) {
    const error = new Error(errors.join("; "));
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return {
    deviceId,
    machineId,
    metrics,
    timestamp,
  };
};

const buildSensorHistoryDocs = ({ deviceId, machineId, metrics, source, timestamp }) =>
  Object.entries(metrics).map(([sensor, value]) => ({
    deviceId,
    machineId,
    sensor,
    source,
    timestamp,
    unit: SENSOR_LIMITS[sensor]?.unit || "",
    value,
  }));

const applyTelemetryToMachine = (machine, metrics, deviceId, timestamp) => {
  for (const [sensor, field] of Object.entries(MACHINE_FIELD_MAP)) {
    if (metrics[sensor] !== undefined) {
      machine[field] = metrics[sensor];
    }
  }

  machine.lastHeartbeat = timestamp;
  machine.lastLiveTelemetryAt = timestamp;
  machine.linkedDeviceId = deviceId;
  machine.liveTelemetryEnabled = true;
  machine.telemetrySource = "iot";
};

const buildAiInsights = (predictiveOverview) => ({
  generatedAt: new Date().toISOString(),
  insights: predictiveOverview.recommendations.map((item) => ({
    machineId: item.machineId,
    recommendation: item.recommendation,
    riskLevel: item.riskLevel,
    title: item.title,
  })),
});

const ensureDevice = async ({ deviceId, machineId, metrics, source }) => {
  const seen = await recordTelemetrySeen(deviceId, {
    healthStatus: "healthy",
    supportedSensors: Object.keys(metrics),
  });

  if (seen?.device) {
    return seen;
  }

  const device = await registerDevice(
    {
      deviceId,
      deviceType: "Unknown",
      healthStatus: "healthy",
      machineId,
      protocol: source === "rest" ? "REST" : "MQTT",
      supportedSensors: Object.keys(metrics),
    },
    { source }
  );

  return {
    device,
    wasOffline: true,
  };
};

export const processTelemetryPacket = async (
  payload,
  { gateway, source = "mqtt" } = {}
) => {
  const normalized = validateTelemetryPayload(payload);
  const machine = await Machine.findOne({ machineId: normalized.machineId });

  if (!machine) {
    const error = new Error("Mapped machine was not found");
    error.statusCode = 404;
    throw error;
  }

  const deviceState = await ensureDevice({
    deviceId: normalized.deviceId,
    machineId: normalized.machineId,
    metrics: normalized.metrics,
    source,
  });

  if (deviceState.device.machineId !== normalized.machineId) {
    const error = new Error("Device is mapped to a different machine");
    error.statusCode = 409;
    throw error;
  }

  const rawPayload = {
    ...payload,
  };
  delete rawPayload.deviceSecret;

  await Telemetry.create({
    deviceId: normalized.deviceId,
    machineId: normalized.machineId,
    metrics: normalized.metrics,
    rawPayload,
    source,
    timestamp: normalized.timestamp,
  });

  const historyDocs = buildSensorHistoryDocs({
    deviceId: normalized.deviceId,
    machineId: normalized.machineId,
    metrics: normalized.metrics,
    source,
    timestamp: normalized.timestamp,
  });

  if (historyDocs.length > 0) {
    await SensorHistory.insertMany(historyDocs, { ordered: false });
  }

  applyTelemetryToMachine(
    machine,
    normalized.metrics,
    normalized.deviceId,
    normalized.timestamp
  );

  let prediction = createMachinePrediction(machine.toObject());
  machine.health = normalized.metrics.health ?? getTelemetryHealth(normalized.metrics, prediction);
  prediction = createMachinePrediction(machine.toObject());
  machine.status = getMachineStatus({
    failureProbability: prediction.failureProbability,
    health: machine.health,
  });
  machine.aiPrediction = toLegacyAiPrediction(prediction);
  machine.remainingUsefulLifeHours = prediction.remainingUsefulLifeHours;
  machine.predictedFailureProbability = prediction.failureProbability;
  appendPredictionHistory(machine, prediction);

  await machine.save();

  let aiIntelligence = null;

  try {
    aiIntelligence = await runRealtimeAI(machine.toObject(), {
      gateway,
      metrics: normalized.metrics,
      source,
      timestamp: normalized.timestamp,
    });

    machine.aiIntelligence = aiIntelligence.machineSummary;
    machine.aiHealthPercent = aiIntelligence.remainingUsefulLife.healthPercent;
    machine.aiRiskPercent = aiIntelligence.remainingUsefulLife.riskPercent;
    machine.aiFailureProbability = aiIntelligence.forecast.peakProbability;
    machine.aiRemainingUsefulLifeHours =
      aiIntelligence.remainingUsefulLife.remainingHours;
    machine.aiRootCauseSummary = aiIntelligence.rootCause.summary;
    machine.aiAnomalySeverity = aiIntelligence.anomaly.severity;
    machine.aiConfidencePercent =
      aiIntelligence.remainingUsefulLife.confidencePercent;
    machine.aiLastAnalyzedAt = normalized.timestamp;
  } catch (error) {
    console.error("Realtime AI analysis failed:", error.message);
  }

  const notifications = await createNotificationsForMachines([machine], gateway);
  await createWorkOrdersForMachines([machine], gateway);

  const updatedMachines = await Machine.find().sort({ machineId: 1 }).lean();
  const predictiveOverview = buildPredictiveOverview(updatedMachines);
  const aiInsights = buildAiInsights(predictiveOverview);
  const telemetryEvent = {
    device: deviceState.device,
    machine: machine.toObject(),
    metrics: normalized.metrics,
    aiIntelligence,
    source,
    timestamp: normalized.timestamp.toISOString(),
  };

  gateway?.emit?.("telemetry:update", telemetryEvent);
  gateway?.emit?.("prediction:update", {
    machineId: machine.machineId,
    prediction,
    timestamp: new Date().toISOString(),
  });

  for (const notification of notifications) {
    gateway?.emit?.("sensor:alert", {
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  if (deviceState.wasOffline) {
    gateway?.emit?.("device:online", deviceState.device);
  }

  if (gateway?.broadcastMachineSnapshot) {
    gateway.broadcastMachineSnapshot(updatedMachines, {
      aiInsights,
      predictiveOverview,
    });
  } else {
    gateway?.emit?.("machineUpdate", updatedMachines);
    gateway?.emit?.("predictive:overview", predictiveOverview);
  }

  return {
    device: deviceState.device,
    machine: machine.toObject(),
    metrics: normalized.metrics,
    notifications,
    prediction,
    aiIntelligence,
    timestamp: normalized.timestamp.toISOString(),
  };
};

export const getLatestTelemetryForDevice = async (deviceId) =>
  Telemetry.findOne({ deviceId }).sort({ timestamp: -1 }).lean();

export const getTelemetryHistory = async ({
  deviceId,
  machineId,
  limit = 200,
  sensor,
} = {}) => {
  const filters = {};

  if (deviceId) filters.deviceId = deviceId;
  if (machineId) filters.machineId = machineId;
  if (sensor) filters.sensor = sensor;

  return SensorHistory.find(filters)
    .sort({ timestamp: -1 })
    .limit(Math.min(Number(limit) || 200, 1000))
    .lean();
};
