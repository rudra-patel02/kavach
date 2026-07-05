import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import { createWorkOrderFromCriticalNotification } from "./workOrderService.js";
import { createMachinePrediction } from "./predictionService.js";

const DEFAULT_THRESHOLDS = {
  temperature: 90,
  vibration: 1.2,
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
    severity: value.severity,
    machineId: value.machineId,
    machineName: value.machineName,
    title: value.title,
    message: value.message,
    icon: value.icon,
    value: value.value,
    threshold: value.threshold,
    read: Boolean(value.read),
    readAt: value.readAt ? new Date(value.readAt).toISOString() : null,
    createdAt: new Date(value.createdAt).toISOString(),
    updatedAt: new Date(value.updatedAt).toISOString(),
  };
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
}) => ({
  type,
  severity,
  machineId: machine.machineId,
  machineName: machine.name,
  title,
  message,
  icon,
  value,
  threshold,
  dedupeKey: `${machine.machineId}:${type}:${severity}`,
});

export const buildNotificationCandidates = (machine) => {
  const prediction = createMachinePrediction(machine);
  const temperatureThreshold = getMachineThreshold(machine, "temperature");
  const vibrationThreshold = getMachineThreshold(machine, "vibration");
  const temperature = Number(machine.temperature);
  const vibration = Number(machine.vibration);
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

    if (io) {
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
