import mongoose from "mongoose";

const anomalySensorSchema = new mongoose.Schema(
  {
    sensor: String,
    label: String,
    value: Number,
    unit: String,
    movingAverage: Number,
    baseline: Number,
    zScore: Number,
    dynamicThreshold: {
      min: Number,
      max: Number,
    },
    severityScore: Number,
    status: String,
    signals: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { _id: false }
);

const anomalySchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    machineName: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "Production",
      index: true,
    },
    anomaly: {
      type: Boolean,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    severityScore: {
      type: Number,
      default: 0,
      index: true,
    },
    reason: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["mqtt", "rest", "simulator", "manual", "unknown"],
      default: "unknown",
      index: true,
    },
    telemetry: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sensors: {
      type: [anomalySensorSchema],
      default: [],
    },
    dynamicThresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    movingAverages: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    zScores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    spikeDetections: {
      type: [String],
      default: [],
    },
    driftDetections: {
      type: [String],
      default: [],
    },
    aiEngineVersion: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

anomalySchema.index({ machineId: 1, timestamp: -1 });
anomalySchema.index({ machineId: 1, severity: 1, timestamp: -1 });

export default mongoose.model("Anomaly", anomalySchema);
