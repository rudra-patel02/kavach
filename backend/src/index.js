import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import connectDB, { disconnectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import copilotRoutes from "./routes/copilotRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import executiveRoutes from "./routes/executiveRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import iotRoutes from "./routes/iotRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import workOrderRoutes from "./routes/workOrderRoutes.js";
import { createIoTConnectionManager } from "./iot/connectionManager.js";
import { startSensorSimulation } from "./services/SensorService.js";
import { syncActiveMachineNotifications } from "./services/notificationService.js";
import { syncActiveMachineWorkOrders } from "./services/workOrderService.js";
import { createSocketServer } from "./socket/index.js";
import userRoutes from "./routes/userRoutes.js";
import {
  rateLimit,
  sanitizeRequest,
  securityHeaders,
} from "./middleware/securityMiddleware.js";
import {
  requestContext,
  requestMetrics,
} from "./middleware/observabilityMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const normalizeOrigin = (origin) => {
  const value = origin.trim().replace(/\/+$/, "");

  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

const parseCorsOrigins = (value) => {
  if (!value || value.trim() === "*" || value.trim() === "") {
    return "*";
  }

  const origins = value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return origins.length > 0 ? origins : "*";
};

const buildCorsOptions = (allowedOrigins) => ({
  origin:
    allowedOrigins === "*"
      ? "*"
      : (origin, callback) => {
          if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
            callback(null, true);
          } else {
            callback(new Error("Origin is not allowed by CORS"));
          }
        },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});

const parseBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const mongoReadyStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const getConfiguration = () => {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter(
    (name) => !process.env[name]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const port = Number(process.env.PORT || 5000);
  const sensorIntervalMs = Number(process.env.SENSOR_INTERVAL_MS || 2000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (
    !Number.isFinite(sensorIntervalMs) ||
    sensorIntervalMs < 250 ||
    sensorIntervalMs > 60000
  ) {
    throw new Error("SENSOR_INTERVAL_MS must be a number between 250 and 60000");
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      "JWT_SECRET is shorter than 32 characters; rotate it before production use"
    );
  }

  return {
    port,
    allowedOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
    enableSensorSimulation: parseBoolean(process.env.ENABLE_SENSOR_SIMULATION, false),
    sensorIntervalMs,
  };
};

const start = async () => {
  const {
    port,
    allowedOrigins,
    enableSensorSimulation,
    sensorIntervalMs,
  } = getConfiguration();
  await connectDB();

  const app = express();
  const server = http.createServer(app);
  const corsOptions = buildCorsOptions(allowedOrigins);
  const socketServer = createSocketServer(server, corsOptions);
  const { io, gateway: machineGateway } = socketServer;
  const iotConnectionManager = createIoTConnectionManager({
    gateway: machineGateway,
  });

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.set("io", io);
  app.set("machineGateway", machineGateway);
  app.set("iotConnectionManager", iotConnectionManager);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(rateLimit());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(sanitizeRequest);
  app.use(requestMetrics);

  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/copilot", copilotRoutes);
  app.use("/api/docs", docsRoutes);
  app.use("/api/executive", executiveRoutes);
  app.use("/api/iot", iotRoutes);
  app.use("/api/machines", machineRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/predictive", predictionRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/system", systemRoutes);
  app.use("/api/tenants", tenantRoutes);
  app.use("/api/workorders", workOrderRoutes);

  app.get("/api/health", (req, res) => {
    const databaseState =
      mongoReadyStates[mongoose.connection.readyState] || "unknown";

    res.json({
      success: mongoose.connection.readyState === 1,
      service: "kavach-backend",
      database: databaseState,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Kavach Backend Running",
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
    });
  });

  app.use((err, req, res, next) => {
    if (err.message === "Origin is not allowed by CORS") {
      return res.status(403).json({
        message: "Origin is not allowed by CORS",
      });
    }

    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });

  console.log(`Server running on port ${port}`);

  await iotConnectionManager.start();

  try {
    await syncActiveMachineNotifications(machineGateway);
    await syncActiveMachineWorkOrders(machineGateway);
  } catch (error) {
    console.error("Initial maintenance automation sync failed:", error.message);
  }

  const stopSensorSimulation = enableSensorSimulation
    ? startSensorSimulation(machineGateway, sensorIntervalMs)
    : () => {};

  if (!enableSensorSimulation) {
    console.log("Sensor simulation disabled");
  }

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received; shutting down`);
    stopSensorSimulation();
    await iotConnectionManager.stop();

    await new Promise((resolve) => {
      socketServer.close(() => {
        server.close(() => resolve());
      });
    });

    await disconnectDB();
  };

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      shutdown(signal)
        .then(() => {
          process.exitCode = 0;
        })
        .catch((error) => {
          console.error("Shutdown failed:", error.message);
          process.exitCode = 1;
        });
    });
  }
};

start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
});
