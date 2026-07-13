import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import aiRoutes from "./routes/aiRoutes.js";
import adminRepairRoutes from "./routes/adminRepairRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import { connectDBWithRetry, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import copilotRoutes from "./routes/copilotRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import executiveRoutes from "./routes/executiveRoutes.js";
import enterpriseRoutes from "./routes/enterpriseRoutes.js";
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
import { buildCorsOptions } from "./config/cors.js";
import { getEnvironmentConfig } from "./config/environment.js";
import { startSensorSimulation } from "./services/SensorService.js";
import { startBackupScheduler } from "./services/backupService.js";
import { syncActiveMachineNotifications } from "./services/notificationService.js";
import { syncActiveMachineWorkOrders } from "./services/workOrderService.js";
import { createSocketServer } from "./socket/index.js";
import userRoutes from "./routes/userRoutes.js";
import {
  rateLimit,
  sanitizeRequest,
  secureCookies,
  securityHeaders,
} from "./middleware/securityMiddleware.js";
import {
  requestContext,
  requestMetrics,
} from "./middleware/observabilityMiddleware.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/errorMiddleware.js";
import {
  cacheControl,
  compression,
  memoryCache,
} from "./middleware/performanceMiddleware.js";
import { tenantContext } from "./middleware/tenantMiddleware.js";
import { getPublicHealth } from "./controllers/systemController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.stack || reason.message : reason;
  console.error("Unhandled promise rejection:", message);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.stack || error.message);
});

const logStartup = (message, metadata = {}) => {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  );
};

const logStartupError = (message, error, metadata = {}) => {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
      error: error?.message || String(error),
      stack: error?.stack,
      ...metadata,
    })
  );
};

const runStartupStep = async (name, step) => {
  const startedAt = Date.now();
  logStartup("startup_step_started", { step: name });

  try {
    const result = await step();
    logStartup("startup_step_completed", {
      durationMs: Date.now() - startedAt,
      step: name,
    });
    return result;
  } catch (error) {
    logStartupError("startup_step_failed", error, {
      durationMs: Date.now() - startedAt,
      step: name,
    });
    return null;
  }
};

const start = async () => {
  const {
    port,
    allowedOrigins,
    enableSensorSimulation,
    backupScheduleEnabled,
    rateLimitMax,
    rateLimitWindowMs,
    sensorIntervalMs,
    corsCredentials,
  } = getEnvironmentConfig();
  logStartup("startup_config_loaded", {
    environment: process.env.NODE_ENV || "development",
    port,
  });

  const dbConnection = await runStartupStep("mongodb_connect", () =>
    connectDBWithRetry()
  );

  if (!dbConnection) {
    throw new Error("MongoDB connection failed; refusing to start HTTP server");
  }

  const app = express();
  const server = http.createServer(app);
  const corsOptions = buildCorsOptions(allowedOrigins, {
    credentials: corsCredentials,
  });
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
  app.use(secureCookies);
  app.use(compression());
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use(rateLimit({ max: rateLimitMax, windowMs: rateLimitWindowMs }));
  app.use(express.json({ limit: "1mb" }));
  app.use(sanitizeRequest);
  app.use(tenantContext);
  app.use(requestMetrics);

  app.use("/api/admin", adminRepairRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/copilot", copilotRoutes);
  app.use(
    "/api/docs",
    cacheControl({ maxAgeSeconds: 300, scope: "public" }),
    memoryCache({ maxEntries: 5, ttlMs: 300000 }),
    docsRoutes
  );
  app.use("/api/enterprise", enterpriseRoutes);
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

  app.get("/api/health", getPublicHealth);

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Kavach Backend Running",
    });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  logStartup("http_server_listen_start", { port });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });

  logStartup("http_server_listening", { port });

  let stopSensorSimulation = () => {};
  let stopBackupScheduler = () => {};

  const runBackgroundInitializers = async () => {
    await runStartupStep("iot_connection_manager_start", () =>
      iotConnectionManager.start()
    );

    await runStartupStep("maintenance_automation_sync", async () => {
      await syncActiveMachineNotifications(machineGateway);
      await syncActiveMachineWorkOrders(machineGateway);
    });

    stopSensorSimulation = await runStartupStep("sensor_simulation_start", () => {
      if (!enableSensorSimulation) {
        logStartup("sensor_simulation_disabled");
        return () => {};
      }

      return startSensorSimulation(machineGateway, sensorIntervalMs);
    }) || (() => {});

    stopBackupScheduler = await runStartupStep("backup_scheduler_start", () =>
      startBackupScheduler({
        enabled: backupScheduleEnabled,
      })
    ) || (() => {});
  };

  setImmediate(() => {
    runBackgroundInitializers().catch((error) => {
      logStartupError("background_initializers_failed", error);
    });
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received; shutting down`);
    stopSensorSimulation();
    stopBackupScheduler();
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
