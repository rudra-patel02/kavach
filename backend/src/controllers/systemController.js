import os from "node:os";
import fs from "node:fs";
import mongoose from "mongoose";

import { getDiagnostics } from "../middleware/observabilityMiddleware.js";

const mongoReadyStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const getCpuUsage = () => {
  const load = os.loadavg()[0] || 0;
  const cpuCount = Math.max(os.cpus().length, 1);
  return Number(Math.min(100, (load / cpuCount) * 100).toFixed(2));
};

const getDiskUsage = () => {
  try {
    if (typeof fs.statfsSync !== "function") {
      return {
        availableMb: null,
        totalMb: null,
        usedPercent: null,
      };
    }

    const stats = fs.statfsSync(process.cwd());
    const totalBytes = stats.blocks * stats.bsize;
    const availableBytes = stats.bavail * stats.bsize;
    const usedBytes = totalBytes - availableBytes;

    return {
      availableMb: Number((availableBytes / 1024 / 1024).toFixed(1)),
      totalMb: Number((totalBytes / 1024 / 1024).toFixed(1)),
      usedPercent:
        totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(2)) : 0,
    };
  } catch (error) {
    return {
      availableMb: null,
      error: error.message,
      totalMb: null,
      usedPercent: null,
    };
  }
};

const buildHealthPayload = (req, startedAt) => {
  const memory = process.memoryUsage();
  const io = req.app.get("io");
  const iotConnectionManager = req.app.get("iotConnectionManager");
  const diagnostics = getDiagnostics();
  const databaseState =
    mongoReadyStates[mongoose.connection.readyState] || "unknown";
  const responseTimeMs =
    Number(process.hrtime.bigint() - startedAt) / 1000000;

  return {
    apiVersion: process.env.API_VERSION || "20.0.0",
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
      usagePercent: getCpuUsage(),
    },
    database: {
      host: mongoose.connection.host || "",
      name: mongoose.connection.name || "",
      state: databaseState,
    },
    disk: getDiskUsage(),
    environment: process.env.NODE_ENV || "development",
    memory: {
      freeSystemMb: Number((os.freemem() / 1024 / 1024).toFixed(1)),
      heapTotalMb: Number((memory.heapTotal / 1024 / 1024).toFixed(1)),
      heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
      rssMb: Number((memory.rss / 1024 / 1024).toFixed(1)),
      totalSystemMb: Number((os.totalmem() / 1024 / 1024).toFixed(1)),
    },
    mqtt: iotConnectionManager?.mqttClientManager?.getStatus?.() || {
      connected: false,
      started: false,
    },
    nodeVersion: process.version,
    responseTimeMs: Number(responseTimeMs.toFixed(2)),
    service: "kavach-backend",
    socket: {
      connections: io?.engine?.clientsCount || 0,
    },
    uptimeSeconds: Math.round(process.uptime()),
    diagnostics,
  };
};

export const getPublicHealth = async (req, res) => {
  const startedAt = process.hrtime.bigint();
  const health = buildHealthPayload(req, startedAt);

  res.status(200).json({
    success: true,
    health,
    timestamp: new Date().toISOString(),
  });
};

export const getSystemHealth = async (req, res) => {
  const startedAt = process.hrtime.bigint();
  const health = buildHealthPayload(req, startedAt);

  res.json({
    success: true,
    system: {
      ...health,
      api: {
        averageLatencyMs: health.diagnostics.averageLatencyMs || 0,
        errorRate: health.diagnostics.errorRate || 0,
        requests: health.diagnostics.requests || 0,
        routes: (health.diagnostics.routes || []).slice(0, 20),
      },
      diagnostics: {
        ...health.diagnostics,
        routes: health.diagnostics.routes.slice(0, 20),
      },
    },
    timestamp: new Date().toISOString(),
  });
};
