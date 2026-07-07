import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { createApp } from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { getEnvironmentConfig, parseBoolean } from "./config/environment.js";
import { createMqttClientManager } from "./iot/mqttClient.js";
import { attachMqttIngest } from "./iot/mqttIngest.js";
import { startSimulator } from "./iot/telemetrySimulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Part 1 boot: validate env (fail fast), connect Mongo, serve the in-scope API.
// MQTT ingest + Socket.IO + background workers return in Parts 2–5.
const start = async () => {
  const { port } = getEnvironmentConfig();

  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });

  console.log(`Server running on port ${port}`);

  // Part 2 — telemetry ingest. The MQTT subscriber (real devices, fail-closed)
  // and the dev-only simulator are both opt-in via env so nothing background
  // starts unless explicitly enabled.
  let mqttManager = null;
  let stopSimulator = () => {};

  if (parseBoolean(process.env.IOT_ENABLED, false)) {
    mqttManager = createMqttClientManager();
    mqttManager.events.on("connect", () => {
      attachMqttIngest(mqttManager.getClient());
      console.log("MQTT telemetry ingest attached");
    });
    mqttManager.events.on("error", (error) => {
      console.error("MQTT client error:", error.message);
    });
    await mqttManager.start();
  }

  stopSimulator = startSimulator({ intervalMs: getEnvironmentConfig().sensorIntervalMs });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received; shutting down`);

    stopSimulator();

    if (mqttManager) {
      await mqttManager.stop();
    }

    await new Promise((resolve) => {
      server.close(() => resolve());
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
