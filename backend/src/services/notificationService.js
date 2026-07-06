import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import { createWorkOrderFromCriticalNotification } from "./workOrderService.js";
import { createMachinePrediction } from "./predictionService.js";

const DEFAULT_THRESHOLDS = {
  temperature: 90,
  vibration: 1.2,
  pressureHigh: 2.1,
  pressureLow: 0.65,
  power: 850,
};

const NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000;
const lastCreatedAtByKey = new Map();

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const getMachineThreshold = (machine, metric) => {
  const configuredValue =
    machine.thresholds?.[metric] ??
    machine[`${metric}Threshold`] ??
    DEFAULT_THRESHOLDS[metric];
  const threshold = Number(configuredValue);

  return Number.isFinite(threshold) ? threshold : DEFAULT_THRESHOLDS[metric];
};

export const serializeNotification = (notification) => {
  const value =
    notification && typeof notification.toObject === "function"
      ? notification.toObject()
      : notification;

  return {
    id: String(value._id),
    type: value.type,
    category: value.category || value.type,
    severity: value.severity,
    displaySeverity:
      value.severity === "Critical"
        ? "Critical"
        : ["High", "Medium"].includes(value.severity)
          ? "Warning"
          : "Information",
    machineId: value.machineId,
    machineName: value.machineName,
    title: value.title,
    message: value.message,
    description: value.description || value.message,
    icon: value.icon,
    value: value.value,
    threshold: value.threshold,
    priority: value.priority || "P4",
    failureProbability: round(value.failureProbability, 1),
    suggestedAction: value.suggestedAction || "",
    assetId: value.assetId || "",
    organizationId: value.organizationId || "",
    plantId: value.plantId || "",
    tenantId: value.tenantId || "",
    owner: value.owner || "",
    escalationLevel: value.escalationLevel || 0,
    escalationStatus: value.escalationStatus || "Open",
    channels: value.channels || ["push"],
    estimatedDowntimeHours: round(value.estimatedDowntimeHours, 1),
    recommendedEngineer: value.recommendedEngineer || "",
    machineLocation: value.machineLocation || "",
    alertTimeline: (value.alertTimeline || []).map((item) => ({
      event: item.event,
      at: new Date(item.at).toISOString(),
      actor: item.actor,
      message: item.message,
    })),
    alertHistory: (value.alertHistory || []).map((item) => ({
      event: item.event,
      at: new Date(item.at).toISOString(),
      actor: item.actor,
      message: item.message,
    })),
    comments: (value.comments || []).map((comment) => ({
      author: comment.author,
      createdAt: new Date(comment.createdAt).toISOString(),
      text: comment.text,
    })),
    deliveryAttempts: (value.deliveryAttempts || []).map((attempt) => ({
      attemptedAt: new Date(attempt.attemptedAt).toISOString(),
      channel: attempt.channel,
      error: attempt.error,
      status: attempt.status,
    })),
    read: Boolean(value.read),
    readAt: value.readAt ? new Date(value.readAt).toISOString() : null,
    archived: Boolean(value.archived),
    archivedAt: value.archivedAt ? new Date(value.archivedAt).toISOString() : null,
    createdAt: new Date(value.createdAt).toISOString(),
    updatedAt: new Date(value.updatedAt).toISOString(),
  };
};

const getPriority = (severity) => {
  if (severity === "Critical") return "P1";
  if (severity === "High") return "P2";
  if (severity === "Medium") return "P3";
  return "P4";
};

const getRecommendedEngineer = (machine) => {
  const department = String(machine.department || "").toLowerCase();

  if (department.includes("boiler")) return "Thermal Systems Engineer";
  if (department.includes("utility")) return "Utilities Maintenance Engineer";
  if (department.includes("packaging")) return "Packaging Line Engineer";
  if (department.includes("cooling")) return "Cooling Systems Engineer";
  return "Maintenance Engineer";
};

const getSuggestedAction = (type, prediction) => {
  if (type === "temperature") {
    return "Inspect cooling, lubrication, thermal load, and heat-transfer surfaces.";
  }

  if (type === "vibration") {
    return "Run vibration analysis and inspect bearings, alignment, mounts, and lubrication.";
  }

  if (type === "pressure") {
    return "Inspect pressure controls, filters, valves, pumps, and sensor calibration.";
  }

  if (type === "power") {
    return "Inspect load profile, electrical draw, lubrication, friction, and drive efficiency.";
  }

  if (type === "machine_health") {
    return "Reduce operating load if safe and schedule controlled inspection.";
  }

  if (type === "failure_probability") {
    return prediction.recommendation;
  }

  return prediction.recommendation || "Validate telemetry and schedule maintenance review.";
};

const buildNotification = ({
  machine,
  type,
  severity,
  title,
  message,
  icon,
  value,
  threshold,
  prediction,
}) => {
  const suggestedAction = getSuggestedAction(type, prediction);
  const timelineEvent = {
    event: "ALERT_CREATED",
    at: new Date(),
    actor: "KAVACH Alert Engine",
    message,
    description: message,
  };

  return {
    type,
    category: type,
    severity,
    priority: getPriority(severity),
    assetId: machine.assetId || "",
    organizationId: machine.organizationId || "",
    plantId: machine.plantId || "",
    tenantId: machine.tenantId || "",
    machineId: machine.machineId,
    machineName: machine.name,
    title,
    message,
    icon,
    value,
    threshold,
    failureProbability: prediction.failureProbability,
    suggestedAction,
    estimatedDowntimeHours: prediction.estimatedDowntimeHours,
    recommendedEngineer: getRecommendedEngineer(machine),
    machineLocation:
      machine.location ||
      machine.machineLocation ||
      `${machine.department || "Production"} line`,
    alertTimeline: [timelineEvent],
    alertHistory: [timelineEvent],
    channels:
      severity === "Critical"
        ? ["push", "email", "sms", "teams"]
        : ["push", "email"],
    dedupeKey: `${machine.machineId}:${type}:${severity}`,
    escalationLevel: severity === "Critical" ? 1 : 0,
    owner: getRecommendedEngineer(machine),
  };
};

export const buildNotificationCandidates = (machine) => {
  const prediction = createMachinePrediction(machine);
  const temperatureThreshold = getMachineThreshold(machine, "temperature");
  const vibrationThreshold = getMachineThreshold(machine, "vibration");
  const pressureHighThreshold = getMachineThreshold(machine, "pressureHigh");
  const pressureLowThreshold = getMachineThreshold(machine, "pressureLow");
  const powerThreshold = getMachineThreshold(machine, "power");
  const temperature = Number(machine.temperature);
  const vibration = Number(machine.vibration);
  const pressure = Number(machine.pressure);
  const power = Number(machine.power);
  const health = Number(machine.health);
  const candidates = [];

  if (prediction.failureProbability > 80) {
    candidates.push(
      buildNotification({
        machine,
        type: "failure_probability",
        severity: prediction.failureProbability >= 90 ? "Critical" : "High",
        title: "Failure probability elevated",
        message: `${machine.name} has ${round(
          prediction.failureProbability,
          1
        )}% failure probability and needs maintenance attention.`,
        icon: "activity",
        value: round(prediction.failureProbability, 1),
        threshold: 80,
        prediction,
      })
    );
  }

  if (Number.isFinite(health) && health < 30) {
    candidates.push(
      buildNotification({
        machine,
        type: "machine_health",
        severity: "Critical",
        title: "Machine health critical",
        message: `${machine.name} health dropped to ${round(
          health,
          1
        )}%, below the 30% critical threshold.`,
        icon: "heart-pulse",
        value: round(health, 1),
        threshold: 30,
        prediction,
      })
    );
  }

  if (Number.isFinite(temperature) && temperature > temperatureThreshold) {
    candidates.push(
      buildNotification({
        machine,
        type: "temperature",
        severity:
          temperature >= temperatureThreshold + 5 ? "Critical" : "High",
        title: "Temperature threshold exceeded",
        message: `${machine.name} temperature reached ${round(
          temperature,
          1
        )} C, above its ${round(temperatureThreshold, 1)} C threshold.`,
        icon: "thermometer",
        value: round(temperature, 1),
        threshold: round(temperatureThreshold, 1),
        prediction,
      })
    );
  }

  if (Number.isFinite(vibration) && vibration > vibrationThreshold) {
    candidates.push(
      buildNotification({
        machine,
        type: "vibration",
        severity:
          vibration >= vibrationThreshold + 0.2 ? "Critical" : "High",
        title: "Vibration threshold exceeded",
        message: `${machine.name} vibration is ${round(
          vibration,
          2
        )}, above its ${round(vibrationThreshold, 2)} threshold.`,
        icon: "gauge",
        value: round(vibration, 2),
        threshold: round(vibrationThreshold, 2),
        prediction,
      })
    );
  }

  if (
    Number.isFinite(pressure) &&
    (pressure > pressureHighThreshold || pressure < pressureLowThreshold)
  ) {
    const isHighPressure = pressure > pressureHighThreshold;
    const criticalPressure =
      pressure >= pressureHighThreshold + 0.3 ||
      pressure <= pressureLowThreshold - 0.15;

    candidates.push(
      buildNotification({
        machine,
        type: "pressure",
        severity: criticalPressure ? "Critical" : "High",
        title: "Pressure anomaly detected",
        message: `${machine.name} pressure is ${round(
          pressure,
          2
        )}, outside the ${round(pressureLowThreshold, 2)}-${round(
          pressureHighThreshold,
          2
        )} operating band.`,
        icon: "gauge",
        value: round(pressure, 2),
        threshold: round(
          isHighPressure ? pressureHighThreshold : pressureLowThreshold,
          2
        ),
        prediction,
      })
    );
  }

  if (Number.isFinite(power) && power > powerThreshold) {
    candidates.push(
      buildNotification({
        machine,
        type: "power",
        severity: power >= powerThreshold + 120 ? "Critical" : "High",
        title: "Power spike detected",
        message: `${machine.name} power draw reached ${round(
          power,
          1
        )} kW, above its ${round(powerThreshold, 1)} kW threshold.`,
        icon: "zap",
        value: round(power, 1),
        threshold: round(powerThreshold, 1),
        prediction,
      })
    );
  }

  if (
    String(machine.aiPrediction?.maintenancePriority || "").toLowerCase() ===
      "immediate" ||
    prediction.maintenancePriority === "Immediate"
  ) {
    candidates.push(
      buildNotification({
        machine,
        type: "maintenance",
        severity: "Critical",
        title: "Immediate maintenance recommended",
        message:
          machine.aiPrediction?.recommendation ||
          prediction.recommendation ||
          `${machine.name} requires immediate maintenance.`,
        icon: "wrench",
        value: prediction.remainingUsefulLifeHours,
        threshold: 24,
        prediction,
      })
    );
  }

  return candidates;
};

const shouldSkipNotification = async (candidate) => {
  const lastCreatedAt = lastCreatedAtByKey.get(candidate.dedupeKey) || 0;

  if (Date.now() - lastCreatedAt < NOTIFICATION_COOLDOWN_MS) {
    return true;
  }

  const recentCutoff = new Date(Date.now() - NOTIFICATION_COOLDOWN_MS);
  const existingNotification = await Notification.exists({
    dedupeKey: candidate.dedupeKey,
    createdAt: { $gte: recentCutoff },
  });

  return Boolean(existingNotification);
};

const rememberCreatedNotification = (notification) => {
  lastCreatedAtByKey.set(notification.dedupeKey, Date.now());
};

export const createNotificationsForMachine = async (machine, io) => {
  const candidates = buildNotificationCandidates(machine);
  const createdNotifications = [];

  for (const candidate of candidates) {
    if (await shouldSkipNotification(candidate)) {
      continue;
    }

    const notification = await Notification.create(candidate);
    rememberCreatedNotification(notification);

    const serializedNotification = serializeNotification(notification);
    createdNotifications.push(serializedNotification);

    if (io?.broadcastAlert) {
      io.broadcastAlert(serializedNotification);
    } else if (io?.emit) {
      io.emit("notification:new", serializedNotification);
    }

    if (serializedNotification.severity === "Critical") {
      await createWorkOrderFromCriticalNotification(notification, io);
    }
  }

  return createdNotifications;
};

export const createNotificationsForMachines = async (machines, io) => {
  const createdNotifications = [];

  for (const machine of machines) {
    const machineNotifications = await createNotificationsForMachine(machine, io);
    createdNotifications.push(...machineNotifications);
  }

  return createdNotifications;
};

export const syncActiveMachineNotifications = async (io) => {
  const machines = await Machine.find().sort({ machineId: 1 }).lean();
  return createNotificationsForMachines(machines, io);
};
