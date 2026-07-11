import mongoose from "mongoose";

const telemetryMetricSchema = new mongoose.Schema(
  {
    temperature: Number,
    humidity: Number,
    pressure: Number,
    current: Number,
    voltage: Number,
    rpm: Number,
    power: Number,
    energy: Number,
    oilLevel: Number,
    vibration: Number,
    noise: Number,
    flowRate: Number,
    gasSensor: Number,
  },
  { _id: false }
);

const telemetrySchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    organizationId: {
      type: String,
      default: "",
      index: true,
    },
    plantId: {
      type: String,
      default: "",
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["mqtt", "rest", "simulator", "unknown"],
      default: "unknown",
      index: true,
    },
    metrics: {
      type: telemetryMetricSchema,
      required: true,
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validationStatus: {
      type: String,
      enum: ["accepted", "rejected"],
      default: "accepted",
    },
  },
  {
    timestamps: true,
  }
);

telemetrySchema.index({ machineId: 1, timestamp: -1 });
telemetrySchema.index({ deviceId: 1, timestamp: -1 });
telemetrySchema.index({ tenantId: 1, organizationId: 1, plantId: 1, timestamp: -1 });

export default mongoose.model("Telemetry", telemetrySchema);
