import mongoose from "mongoose";

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: [
        "ESP32",
        "ESP8266",
        "Arduino",
        "Raspberry Pi",
        "Industrial Edge Gateway",
        "Unknown",
      ],
      default: "Unknown",
    },
    protocol: {
      type: String,
      enum: ["MQTT", "OPC_UA", "MODBUS_TCP", "MODBUS_RTU", "PLC", "REST", "BACNET"],
      default: "MQTT",
      index: true,
    },
    firmwareVersion: {
      type: String,
      default: "unknown",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    macAddress: {
      type: String,
      default: "",
    },
    connectionStatus: {
      type: String,
      enum: ["online", "offline", "unknown"],
      default: "unknown",
      index: true,
    },
    lastSeen: Date,
    lastHeartbeat: Date,
    batteryLevel: {
      type: Number,
      default: null,
    },
    signalStrength: {
      type: Number,
      default: null,
    },
    healthStatus: {
      type: String,
      enum: ["healthy", "warning", "critical", "offline", "unknown"],
      default: "unknown",
      index: true,
    },
    telemetryRate: {
      type: Number,
      default: 0,
    },
    supportedSensors: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    statusTimeline: {
      type: [statusTimelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ machineId: 1, connectionStatus: 1 });
deviceSchema.index({ lastHeartbeat: -1 });

export default mongoose.model("Device", deviceSchema);
