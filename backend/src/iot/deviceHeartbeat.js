import HeartbeatLog from "../models/heartbeatLog.js";
import { updateDeviceHeartbeat } from "./deviceRegistry.js";

const normalizeDeviceId = (topicDeviceId, payloadDeviceId) =>
  String(payloadDeviceId || topicDeviceId || "").trim();

export const processDeviceHeartbeat = async (
  topicDeviceId,
  payload = {},
  { gateway, source = "mqtt" } = {}
) => {
  const deviceId = normalizeDeviceId(topicDeviceId, payload.deviceId);

  if (!deviceId) {
    const error = new Error("deviceId is required for heartbeat");
    error.statusCode = 400;
    throw error;
  }

  const result = await updateDeviceHeartbeat(deviceId, payload, { source });
  const device = result.device;
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

  if (Number.isNaN(timestamp.getTime())) {
    const error = new Error("Heartbeat timestamp is invalid");
    error.statusCode = 400;
    throw error;
  }

  await HeartbeatLog.create({
    batteryLevel: payload.batteryLevel,
    deviceId,
    healthStatus: payload.healthStatus || device.healthStatus,
    machineId: device.machineId,
    signalStrength: payload.signalStrength,
    source,
    timestamp,
  });

  gateway?.emit?.("device:heartbeat", {
    device,
    timestamp: timestamp.toISOString(),
  });

  if (result.wasOffline) {
    gateway?.emit?.("device:online", device);
  }

  return {
    device,
    timestamp: timestamp.toISOString(),
  };
};

export const startDeviceHeartbeatMonitor = ({
  gateway,
  intervalMs = Number(process.env.DEVICE_HEARTBEAT_MONITOR_MS || 15000),
  markOffline,
}) => {
  const timer = setInterval(() => {
    markOffline({ gateway }).catch((error) => {
      console.error("Device heartbeat monitor failed:", error.message);
    });
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
};
