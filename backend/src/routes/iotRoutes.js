import express from "express";

import {
  getDevice,
  getDeviceConfig,
  getDevices,
  getDeviceTelemetry,
  getIoTOverview,
  getLatestDht22SensorReading,
  publishDeviceCommand,
  receiveDht22SensorReading,
  receiveDeviceHeartbeat,
  receiveTelemetry,
  registerIoTDevice,
} from "../controllers/iotController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { deviceAuthMiddleware } from "../middleware/deviceAuthMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const readRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];
const manageRoles = [
  "Super Admin",
  "Admin",
  "Plant Manager",
  "Maintenance Engineer",
];

router.post("/devices/register", deviceAuthMiddleware, registerIoTDevice);
router.post("/telemetry", deviceAuthMiddleware, receiveTelemetry);
router.post("/sensor", receiveDht22SensorReading);
router.post(
  "/devices/:deviceId/heartbeat",
  deviceAuthMiddleware,
  receiveDeviceHeartbeat
);

router.get("/latest", getLatestDht22SensorReading);
router.get("/", authMiddleware, roleMiddleware(readRoles), getIoTOverview);
router.get("/devices", authMiddleware, roleMiddleware(readRoles), getDevices);
router.get(
  "/devices/:deviceId",
  authMiddleware,
  roleMiddleware(readRoles),
  getDevice
);
router.get(
  "/devices/:deviceId/config",
  authMiddleware,
  roleMiddleware(readRoles),
  getDeviceConfig
);
router.get(
  "/devices/:deviceId/telemetry",
  authMiddleware,
  roleMiddleware(readRoles),
  getDeviceTelemetry
);
router.post(
  "/devices/:deviceId/command",
  authMiddleware,
  roleMiddleware(manageRoles),
  publishDeviceCommand
);

export default router;
