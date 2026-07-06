import ConnectionLog from "../models/connectionLog.js";
import Device from "../models/device.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number(number.toFixed(digits));
};

const normalizeDeviceType = (value = "Unknown") => {
  const normalized = String(value || "Unknown").trim();
  const supportedTypes = new Set([
    "ESP32",
    "ESP8266",
    "Arduino",
    "Raspberry Pi",
    "Industrial Edge Gateway",
    "Unknown",
  ]);

  return supportedTypes.has(normalized) ? normalized : "Unknown";
};

const normalizeProtocol = (value = "MQTT") => {
  const normalized = String(value || "MQTT").trim().toUpperCase();
  const supportedProtocols = new Set([
    "MQTT",
    "OPC_UA",
    "MODBUS_TCP",
    "MODBUS_RTU",
    "REST",
    "BACNET",
  ]);

  return supportedProtocols.has(normalized) ? normalized : "MQTT";
};

const normalizeHealthStatus = (value = "unknown") => {
  const normalized = String(value || "unknown").trim().toLowerCase();
  const supportedStatuses = new Set([
    "critical",
    "healthy",
    "offline",
    "unknown",
    "warning",
  ]);

  return supportedStatuses.has(normalized) ? normalized : "unknown";
};

const getTelemetryRate = (device, now = new Date()) => {
  if (!device?.lastSeen) {
    return Number(device?.telemetryRate || 0);
  }

  const previousSeen = new Date(device.lastSeen).getTime();
  const deltaSeconds = Math.max((now.getTime() - previousSeen) / 1000, 0.1);

  return round(60 / deltaSeconds, 2) || 0;
};

export const logConnectionEvent = async ({
  deviceId,
  event,
  machineId = "",
  message = "",
  metadata = {},
  status = "unknown",
}) =>
  ConnectionLog.create({
    deviceId,
    event,
    machineId,
    message,
    metadata,
    status,
  });

const appendStatusTimeline = (device, status, message) => {
  const nextTimeline = [
    ...(Array.isArray(device.statusTimeline) ? device.statusTimeline : []),
    {
      at: new Date(),
      message,
      status,
    },
  ].slice(-50);

  device.statusTimeline = nextTimeline;
};

export const serializeDevice = (device) => {
  const value =
    device && typeof device.toObject === "function" ? device.toObject() : device;

  if (!value) {
    return null;
  }

  return {
    id: String(value._id),
    deviceId: value.deviceId,
    machineId: value.machineId,
    deviceType: value.deviceType,
    protocol: value.protocol,
    firmwareVersion: value.firmwareVersion,
    ipAddress: value.ipAddress,
    macAddress: value.macAddress,
    connectionStatus: value.connectionStatus,
    lastSeen: value.lastSeen ? new Date(value.lastSeen).toISOString() : null,
    lastHeartbeat: value.lastHeartbeat
      ? new Date(value.lastHeartbeat).toISOString()
      : null,
    batteryLevel: value.batteryLevel,
    signalStrength: value.signalStrength,
    healthStatus: value.healthStatus,
    telemetryRate: round(value.telemetryRate, 2) || 0,
    supportedSensors: value.supportedSensors || [],
    metadata: value.metadata || {},
    statusTimeline: (value.statusTimeline || []).map((item) => ({
      at: item.at ? new Date(item.at).toISOString() : new Date().toISOString(),
      message: item.message || "",
      status: item.status,
    })),
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : null,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : null,
  };
};

export const registerDevice = async (payload, { source = "mqtt" } = {}) => {
  const deviceId = String(payload.deviceId || "").trim();
  const machineId = String(payload.machineId || "").trim();

  if (!deviceId || !machineId) {
    const error = new Error("deviceId and machineId are required");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const existingDevice = await Device.findOne({ deviceId });
  const update = {
    batteryLevel:
      payload.batteryLevel === undefined
        ? existingDevice?.batteryLevel
        : clamp(Number(payload.batteryLevel), 0, 100),
    connectionStatus: "online",
    deviceType: normalizeDeviceType(payload.deviceType),
    firmwareVersion: String(payload.firmwareVersion || "unknown"),
    healthStatus: normalizeHealthStatus(payload.healthStatus || "healthy"),
    ipAddress: String(payload.ipAddress || ""),
    lastHeartbeat: now,
    lastSeen: now,
    macAddress: String(payload.macAddress || ""),
    machineId,
    metadata: payload.metadata || existingDevice?.metadata || {},
    protocol: normalizeProtocol(payload.protocol || source),
    signalStrength:
      payload.signalStrength === undefined
        ? existingDevice?.signalStrength
        : clamp(Number(payload.signalStrength), -120, 100),
    supportedSensors: Array.isArray(payload.supportedSensors)
      ? payload.supportedSensors.map(String)
      : existingDevice?.supportedSensors || [],
  };
  const device =
    existingDevice ||
    new Device({
      deviceId,
      machineId,
    });

  Object.assign(device, update);
  appendStatusTimeline(
    device,
    "online",
    existingDevice ? "Device re-registered" : "Device registered"
  );

  await device.save();
  await logConnectionEvent({
    deviceId,
    event: existingDevice ? "DEVICE_REREGISTERED" : "DEVICE_REGISTERED",
    machineId,
    message: `Device registered over ${source}`,
    status: "online",
  });

  return serializeDevice(device);
};

export const updateDeviceHeartbeat = async (
  deviceId,
  payload = {},
  { source = "mqtt" } = {}
) => {
  const now = new Date();
  const device = await Device.findOne({ deviceId });

  if (!device) {
    const error = new Error("Device is not registered");
    error.statusCode = 404;
    throw error;
  }

  const wasOffline = device.connectionStatus !== "online";
  device.connectionStatus = "online";
  device.lastSeen = now;
  device.lastHeartbeat = now;
  device.healthStatus = normalizeHealthStatus(
    payload.healthStatus || device.healthStatus || "healthy"
  );
  device.batteryLevel =
    payload.batteryLevel === undefined
      ? device.batteryLevel
      : clamp(Number(payload.batteryLevel), 0, 100);
  device.signalStrength =
    payload.signalStrength === undefined
      ? device.signalStrength
      : clamp(Number(payload.signalStrength), -120, 100);
  device.telemetryRate =
    payload.telemetryRate === undefined
      ? device.telemetryRate
      : Math.max(0, Number(payload.telemetryRate) || 0);

  if (payload.ipAddress) {
    device.ipAddress = String(payload.ipAddress);
  }

  if (payload.firmwareVersion) {
    device.firmwareVersion = String(payload.firmwareVersion);
  }

  if (payload.supportedSensors) {
    device.supportedSensors = Array.isArray(payload.supportedSensors)
      ? payload.supportedSensors.map(String)
      : device.supportedSensors;
  }

  if (wasOffline) {
    appendStatusTimeline(device, "online", "Heartbeat restored");
  }

  await device.save();

  if (wasOffline) {
    await logConnectionEvent({
      deviceId,
      event: "DEVICE_ONLINE",
      machineId: device.machineId,
      message: `Heartbeat restored over ${source}`,
      status: "online",
    });
  }

  return {
    device: serializeDevice(device),
    wasOffline,
  };
};

export const recordTelemetrySeen = async (deviceId, payload = {}) => {
  const now = new Date();
  const device = await Device.findOne({ deviceId });

  if (!device) {
    return null;
  }

  const wasOffline = device.connectionStatus !== "online";
  device.connectionStatus = "online";
  device.healthStatus = normalizeHealthStatus(
    payload.healthStatus || device.healthStatus || "healthy"
  );
  device.lastSeen = now;
  device.telemetryRate = getTelemetryRate(device, now);

  if (payload.supportedSensors) {
    device.supportedSensors = payload.supportedSensors;
  }

  if (wasOffline) {
    appendStatusTimeline(device, "online", "Telemetry restored");
  }

  await device.save();

  if (wasOffline) {
    await logConnectionEvent({
      deviceId,
      event: "DEVICE_ONLINE",
      machineId: device.machineId,
      message: "Telemetry restored",
      status: "online",
    });
  }

  return {
    device: serializeDevice(device),
    wasOffline,
  };
};

export const markStaleDevicesOffline = async ({
  gateway,
  staleAfterMs = Number(process.env.DEVICE_OFFLINE_AFTER_MS || 45000),
} = {}) => {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const staleDevices = await Device.find({
    connectionStatus: "online",
    lastSeen: { $lt: cutoff },
  });
  const offlineDevices = [];

  for (const device of staleDevices) {
    device.connectionStatus = "offline";
    device.healthStatus = "offline";
    appendStatusTimeline(device, "offline", "Heartbeat timeout");
    await device.save();

    const serializedDevice = serializeDevice(device);
    offlineDevices.push(serializedDevice);
    await logConnectionEvent({
      deviceId: device.deviceId,
      event: "DEVICE_OFFLINE",
      machineId: device.machineId,
      message: "Heartbeat timeout",
      status: "offline",
    });
    gateway?.emit?.("device:offline", serializedDevice);
  }

  return offlineDevices;
};

export const listDevices = async (query = {}) => {
  const filters = {};

  if (query.status && query.status !== "all") {
    filters.connectionStatus = query.status;
  }

  if (query.machineId) {
    filters.machineId = query.machineId;
  }

  const devices = await Device.find(filters).sort({ updatedAt: -1 }).lean();

  return devices.map(serializeDevice);
};

export const getDeviceById = async (deviceId) => {
  const device = await Device.findOne({ deviceId }).lean();
  return serializeDevice(device);
};
