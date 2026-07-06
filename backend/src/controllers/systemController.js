import os from "node:os";
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

export const getSystemHealth = async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const io = req.app.get("io");
    const iotConnectionManager = req.app.get("iotConnectionManager");
    const diagnostics = getDiagnostics();

    res.json({
      success: true,
      system: {
        api: {
          averageLatencyMs: diagnostics.averageLatencyMs,
          errorRate: diagnostics.errorRate,
          requests: diagnostics.requests,
          routes: diagnostics.routes.slice(0, 20),
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg(),
          usagePercent: getCpuUsage(),
        },
        database: {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          state:
            mongoReadyStates[mongoose.connection.readyState] || "unknown",
        },
        memory: {
          freeSystemMb: Number((os.freemem() / 1024 / 1024).toFixed(1)),
          heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
          rssMb: Number((memory.rss / 1024 / 1024).toFixed(1)),
          totalSystemMb: Number((os.totalmem() / 1024 / 1024).toFixed(1)),
        },
        mqtt: iotConnectionManager?.mqttClientManager?.getStatus?.() || {
          connected: false,
          started: false,
        },
        socket: {
          connections: io?.engine?.clientsCount || 0,
        },
        uptimeSeconds: Math.round(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to load system health:", error);
    res.status(500).json({ message: "Failed to load system health" });
  }
};
