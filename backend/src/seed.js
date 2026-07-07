import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./config/db.js";
import Machine from "./models/machine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

await connectDB();

await Machine.deleteMany({});

// Clean in-scope machines with per-metric thresholds. Health/status/healthScore
// are derived from real readings by the health engine, so they start at their
// defaults (Running / 100) until telemetry arrives.
await Machine.insertMany([
  {
    machineId: "M001",
    name: "Compressor-01",
    location: "Production Bay A",
    linkedDeviceId: "DEV-001",
    thresholds: [
      { metric: "temperature", unit: "C", warnMax: 75, critMax: 90 },
      { metric: "vibration", unit: "mm/s", warnMax: 0.6, critMax: 1.0 },
      { metric: "oilLevel", unit: "%", warnMin: 40, critMin: 20 },
    ],
  },
  {
    machineId: "M002",
    name: "Pump-03",
    location: "Utility Room",
    linkedDeviceId: "DEV-002",
    thresholds: [
      { metric: "temperature", unit: "C", warnMax: 80, critMax: 95 },
      { metric: "pressure", unit: "bar", warnMax: 2.0, critMax: 2.5 },
    ],
  },
  {
    machineId: "M003",
    name: "Boiler-02",
    location: "Boiler House",
    linkedDeviceId: "DEV-003",
    thresholds: [
      { metric: "temperature", unit: "C", warnMax: 90, critMax: 105 },
      { metric: "pressure", unit: "bar", warnMax: 2.2, critMax: 2.8 },
    ],
  },
  {
    machineId: "M004",
    name: "Conveyor-01",
    location: "Packaging Line",
    linkedDeviceId: "DEV-004",
    thresholds: [
      { metric: "temperature", unit: "C", warnMax: 70, critMax: 85 },
      { metric: "rpm", unit: "rpm", warnMin: 1200, critMin: 1000 },
    ],
  },
]);

console.log("✅ KAVACH machine database seeded (4 machines with thresholds).");

await mongoose.connection.close();

process.exit(0);
