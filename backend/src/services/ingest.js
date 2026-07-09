import crypto from "node:crypto";

import Machine from "../models/machine.js";
import Reading from "../models/reading.js";
import { parseBoolean } from "../config/environment.js";
import { emitEvent } from "../socket/index.js";
import { SOCKET_EVENTS } from "../socket/events.js";
import { computeHealth } from "./health.js";
import { syncAlerts } from "./alerts.js";

// Metrics the ingest understands, with their canonical unit. A value for any of
// these may arrive either as a top-level key or inside a nested `metrics` object.
export const METRIC_UNITS = {
  temperature: "C",
  humidity: "%",
  pressure: "bar",
  current: "A",
  voltage: "V",
  rpm: "rpm",
  power: "kW",
  energy: "kWh",
  oilLevel: "%",
  vibration: "mm/s",
  noise: "dB",
  flowRate: "L/min",
  gasSensor: "ppm",
  // Production counters (per-report increments) that feed the Part 3 KPI engine:
  // OEE performance = produced / (ratedThroughput × runtime), quality = good / total.
  unitsTotal: "count",
  unitsGood: "count",
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

// --- device authentication ------------------------------------------------
// Fail CLOSED: if DEVICE_SECRET is not configured, every device is rejected —
// there is no environment in which telemetry is accepted without a secret.
export const verifyDeviceSecret = (supplied) => {
  const expected = process.env.DEVICE_SECRET;

  if (!expected || typeof supplied !== "string" || supplied.length === 0) {
    return false;
  }

  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);

  // timingSafeEqual requires equal-length buffers.
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
};

// --- simulator / live-source gating ---------------------------------------
export const isSimulationEnabled = () =>
  parseBoolean(process.env.ENABLE_SENSOR_SIMULATION, false);

// The sources that count as "live" right now. Simulated readings only count
// when the simulator is explicitly enabled; otherwise they are stored but
// excluded from health, status and alerts.
export const liveSources = () =>
  isSimulationEnabled() ? ["device", "sim"] : ["device"];

export const resolveSource = (requested) => (requested === "sim" ? "sim" : "device");

// --- payload validation ---------------------------------------------------
const extractMetrics = (payload) => {
  const source = { ...(payload.metrics || {}) };

  for (const metric of Object.keys(METRIC_UNITS)) {
    if (payload[metric] !== undefined) {
      source[metric] = payload[metric];
    }
  }

  const metrics = [];

  for (const [metric, rawValue] of Object.entries(source)) {
    if (!(metric in METRIC_UNITS)) {
      continue; // ignore unknown metrics rather than fail the whole packet
    }
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw badRequest(`${metric} must be numeric`);
    }

    metrics.push({ metric, value, unit: METRIC_UNITS[metric] });
  }

  return metrics;
};

export const parseTelemetry = (payload = {}) => {
  const machineId = String(payload.machineId || "").trim();
  const deviceId = String(payload.deviceId || "").trim();

  if (!machineId) {
    throw badRequest("machineId is required");
  }

  const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();
  if (Number.isNaN(ts.getTime())) {
    throw badRequest("timestamp must be a valid date");
  }

  const metrics = extractMetrics(payload);
  if (metrics.length === 0) {
    throw badRequest("at least one supported metric value is required");
  }

  return { machineId, deviceId, ts, metrics };
};

// --- the pipeline ---------------------------------------------------------
// Transport-agnostic: MQTT, a future REST device endpoint, and the simulator
// all funnel through here. `trusted` skips the device-secret check for internal
// callers (the simulator); every external transport must pass a `deviceSecret`.
export const ingestTelemetry = async (
  payload,
  { source = "device", deviceSecret, trusted = false } = {}
) => {
  if (!trusted && !verifyDeviceSecret(deviceSecret)) {
    const error = new Error("Unauthorized device");
    error.statusCode = 401;
    throw error;
  }

  const resolvedSource = resolveSource(source);
  const { machineId, deviceId, ts, metrics } = parseTelemetry(payload);

  const machine = await Machine.findOne({
    $or: [{ machineId }, ...(deviceId ? [{ linkedDeviceId: deviceId }] : [])],
  });

  if (!machine) {
    const error = new Error(`No machine mapped to ${machineId}`);
    error.statusCode = 404;
    throw error;
  }

  const resolvedDeviceId = deviceId || machine.linkedDeviceId || "";

  const readings = await Reading.insertMany(
    metrics.map((metric) => ({
      machineId: machine.machineId,
      deviceId: resolvedDeviceId,
      metric: metric.metric,
      value: metric.value,
      unit: metric.unit,
      ts,
      source: resolvedSource,
    }))
  );

  // A reading only affects live health/status/alerts if its source counts as
  // live right now. A simulated reading with the simulator off is persisted
  // (flagged sim) but never drives the machine's state.
  const counted = liveSources().includes(resolvedSource);

  if (!counted) {
    return {
      machine,
      readings,
      breaches: [],
      alerts: { raised: [], resolved: [], activeCount: 0 },
      source: resolvedSource,
      counted: false,
    };
  }

  const latestLive = await Reading.aggregate([
    { $match: { machineId: machine.machineId, source: { $in: liveSources() } } },
    { $sort: { ts: -1, _id: -1 } },
    {
      $group: {
        _id: "$metric",
        metric: { $first: "$metric" },
        value: { $first: "$value" },
        ts: { $first: "$ts" },
      },
    },
  ]);

  const { healthScore, status, breaches } = computeHealth(machine, latestLive);

  machine.healthScore = healthScore;
  machine.status = status;
  machine.lastReadingAt = ts;
  machine.lastReadingSource = resolvedSource;
  await machine.save();

  const alerts = await syncAlerts({ machineId: machine.machineId, breaches, ts });

  // Live push (Part 5): the machine's health/status changed and the plant KPIs
  // may have moved, so tell connected clients to refresh; surface any new alert.
  emitEvent(SOCKET_EVENTS.MACHINE_UPDATE, {
    machineId: machine.machineId,
    status: machine.status,
    healthScore: machine.healthScore,
    lastReadingAt: machine.lastReadingAt,
  });
  emitEvent(SOCKET_EVENTS.KPI_UPDATE, { machineId: machine.machineId });
  for (const alert of alerts.raised || []) {
    emitEvent(SOCKET_EVENTS.ALERT_CREATED, {
      id: String(alert._id || alert.id || ""),
      machineId: alert.machineId,
      metric: alert.metric,
      severity: alert.severity,
      breachValue: alert.breachValue,
      ts: alert.ts,
    });
  }

  return { machine, readings, breaches, alerts, source: resolvedSource, counted: true };
};
