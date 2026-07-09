import ConnectionLog from "../models/connectionLog.js";
import HeartbeatLog from "../models/heartbeatLog.js";
import Telemetry from "../models/telemetry.js";
import {
  getDeviceById,
  listDevices,
  registerDevice,
} from "../iot/deviceRegistry.js";
import {
  getDeviceRegistrationConfig,
  getFirmwareExamples,
  SUPPORTED_EDGE_DEVICES,
} from "../iot/deviceDiscovery.js";
import { processDeviceHeartbeat } from "../iot/deviceHeartbeat.js";
import {
  getTelemetryHistory,
  processTelemetryPacket,
} from "../iot/telemetryProcessor.js";

const getGateway = (req) => req.app.get("machineGateway") || req.app.get("io");

const serializeTelemetry = (telemetry) => ({
  id: String(telemetry._id),
  createdAt: telemetry.createdAt
    ? new Date(telemetry.createdAt).toISOString()
    : null,
  deviceId: telemetry.deviceId,
  machineId: telemetry.machineId,
  metrics: telemetry.metrics || {},
  source: telemetry.source,
  timestamp: telemetry.timestamp
    ? new Date(telemetry.timestamp).toISOString()
    : null,
});

export const getIoTOverview = async (req, res) => {
  try {
    const [devices, latestTelemetry, connectionLogs] = await Promise.all([
      listDevices(req.query),
      Telemetry.find().sort({ timestamp: -1 }).limit(100).lean(),
      ConnectionLog.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    const onlineDevices = devices.filter(
      (device) => device.connectionStatus === "online"
    ).length;

    res.json({
      success: true,
      overview: {
        devices,
        firmwareExamples: getFirmwareExamples(),
        latestTelemetry: latestTelemetry.map(serializeTelemetry),
        protocolAdapters: SUPPORTED_EDGE_DEVICES,
        status: {
          offlineDevices: devices.length - onlineDevices,
          onlineDevices,
          totalDevices: devices.length,
        },
        statusTimeline: connectionLogs.map((log) => ({
          at: log.createdAt ? new Date(log.createdAt).toISOString() : null,
          deviceId: log.deviceId,
          event: log.event,
          machineId: log.machineId,
          message: log.message,
          status: log.status,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch IoT overview:", error);
    res.status(500).json({ message: "Failed to fetch IoT overview" });
  }
};

export const getDevices = async (req, res) => {
  try {
    const devices = await listDevices(req.query);
    res.json({
      devices,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    res.status(500).json({ message: "Failed to fetch devices" });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await getDeviceById(req.params.deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const [latestTelemetry, heartbeatLogs] = await Promise.all([
      Telemetry.findOne({ deviceId: req.params.deviceId })
        .sort({ timestamp: -1 })
        .lean(),
      HeartbeatLog.find({ deviceId: req.params.deviceId })
        .sort({ timestamp: -1 })
        .limit(25)
        .lean(),
    ]);

    res.json({
      device,
      heartbeatLogs: heartbeatLogs.map((log) => ({
        batteryLevel: log.batteryLevel,
        healthStatus: log.healthStatus,
        signalStrength: log.signalStrength,
        timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : null,
      })),
      latestTelemetry: latestTelemetry
        ? serializeTelemetry(latestTelemetry)
        : null,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch device:", error);
    res.status(500).json({ message: "Failed to fetch device" });
  }
};

export const registerIoTDevice = async (req, res) => {
  try {
    const device = await registerDevice(req.body, { source: "rest" });
    getGateway(req)?.emit?.("device:online", device);

    res.status(201).json({
      device,
      success: true,
    });
  } catch (error) {
    console.error("Device registration failed:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Device registration failed",
    });
  }
};

export const receiveDeviceHeartbeat = async (req, res) => {
  try {
    const heartbeat = await processDeviceHeartbeat(req.params.deviceId, req.body, {
      gateway: getGateway(req),
      source: "rest",
    });

    res.json({
      heartbeat,
      success: true,
    });
  } catch (error) {
    console.error("Device heartbeat failed:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Device heartbeat failed",
    });
  }
};

export const receiveTelemetry = async (req, res) => {
  try {
    const result = await processTelemetryPacket(req.body, {
      gateway: getGateway(req),
      source: "rest",
    });

    res.status(202).json({
      result,
      success: true,
    });
  } catch (error) {
    console.error("Telemetry ingestion failed:", error);
    res.status(error.statusCode || 500).json({
      details: error.details,
      message: error.message || "Telemetry ingestion failed",
    });
  }
};

export const getDeviceTelemetry = async (req, res) => {
  try {
    const history = await getTelemetryHistory({
      deviceId: req.params.deviceId,
      limit: req.query.limit,
      sensor: req.query.sensor,
    });

    res.json({
      history: history.map((item) => ({
        deviceId: item.deviceId,
        machineId: item.machineId,
        sensor: item.sensor,
        source: item.source,
        timestamp: item.timestamp
          ? new Date(item.timestamp).toISOString()
          : null,
        unit: item.unit,
        value: item.value,
      })),
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch telemetry history:", error);
    res.status(500).json({ message: "Failed to fetch telemetry history" });
  }
};

export const getDeviceConfig = async (req, res) => {
  res.json({
    config: getDeviceRegistrationConfig({
      deviceId: req.params.deviceId,
      machineId: req.query.machineId,
    }),
    firmwareExamples: getFirmwareExamples(),
    success: true,
    supportedDevices: SUPPORTED_EDGE_DEVICES,
  });
};

export const publishDeviceCommand = async (req, res) => {
  try {
    const iotConnectionManager = req.app.get("iotConnectionManager");

    if (!iotConnectionManager?.mqttPublisher) {
      return res.status(503).json({
        message: "MQTT publisher is not available",
      });
    }

    const result = await iotConnectionManager.mqttPublisher.publishDeviceCommand(
      req.params.deviceId,
      req.body.command,
      {
        payload: req.body.payload,
        qos: req.body.qos,
        retain: req.body.retain,
      }
    );

    res.json({
      result,
      success: true,
    });
  } catch (error) {
    console.error("Failed to publish device command:", error);
    res.status(500).json({ message: error.message || "Command publish failed" });
  }
};
