import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./config/db.js";
import Machine from "./models/machine.js";
import Notification from "./models/notification.js";
import WorkOrder from "./models/workOrder.js";
import { ensureSeededAdminUser } from "./services/adminUserService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

await connectDB();

await Machine.deleteMany({});
await Notification.deleteMany({});
await WorkOrder.deleteMany({});

await Machine.insertMany([
  {
    machineId: "M001",
    name: "Compressor-01",
    department: "Production",
    status: "Running",
    health: 98,
    temperature: 62,
    vibration: 0.28,
    power: 38,
    efficiency: 96,
    rpm: 1450,
    humidity: 48,
    pressure: 1.2,
    energyConsumed: 420,
    linkedDeviceId: "esp32-dht11-01",
    liveTelemetryEnabled: true,
    telemetrySource: "iot",
  },
  {
    machineId: "M002",
    name: "Pump-03",
    department: "Utility",
    status: "Warning",
    health: 74,
    temperature: 81,
    vibration: 0.72,
    power: 54,
    efficiency: 82,
    rpm: 1380,
    humidity: 51,
    pressure: 1.5,
    energyConsumed: 610,
  },
  {
    machineId: "M003",
    name: "Boiler-02",
    department: "Boiler",
    status: "Critical",
    health: 31,
    temperature: 100,
    vibration: 1.45,
    power: 92,
    efficiency: 59,
    rpm: 1180,
    humidity: 63,
    pressure: 2.4,
    energyConsumed: 980,
  },
  {
    machineId: "M004",
    name: "Conveyor-01",
    department: "Packaging",
    status: "Running",
    health: 93,
    temperature: 47,
    vibration: 0.19,
    power: 26,
    efficiency: 97,
    rpm: 1600,
    humidity: 44,
    pressure: 1.0,
    energyConsumed: 300,
  },
  {
    machineId: "M005",
    name: "Cooling Tower",
    department: "Cooling",
    status: "Running",
    health: 95,
    temperature: 36,
    vibration: 0.12,
    power: 31,
    efficiency: 98,
    rpm: 1500,
    humidity: 40,
    pressure: 1.1,
    energyConsumed: 280,
  },
]);

console.log("✅ KAVACH machine database seeded successfully.");

const adminResult = await ensureSeededAdminUser();

console.log(
  JSON.stringify({
    level: "info",
    message: "seeded_admin_user_ready",
    email: adminResult.email,
    passwordUpdated: adminResult.passwordUpdated,
    storedPasswordIsBcrypt: adminResult.storedPasswordIsBcrypt,
    userId: adminResult.userId,
  })
);

await mongoose.connection.close();

process.exit(0);
