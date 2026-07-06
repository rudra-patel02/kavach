import mongoose from "mongoose";

const machineHealthSnapshotSchema = new mongoose.Schema(
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
    healthPercent: {
      type: Number,
      default: 0,
      index: true,
    },
    riskPercent: {
      type: Number,
      default: 0,
      index: true,
    },
    remainingUsefulLifeHours: {
      type: Number,
      default: 0,
    },
    remainingUsefulLifeDays: {
      type: Number,
      default: 0,
    },
    failureProbability: {
      type: Number,
      default: 0,
      index: true,
    },
    anomaly: {
      type: Boolean,
      default: false,
      index: true,
    },
    anomalySeverity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },
    rootCauseSummary: {
      type: String,
      default: "",
    },
    confidencePercent: {
      type: Number,
      default: 0,
    },
    telemetry: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    forecast: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

machineHealthSnapshotSchema.index({ machineId: 1, timestamp: -1 });
machineHealthSnapshotSchema.index({ anomalySeverity: 1, timestamp: -1 });

export default mongoose.model("MachineHealthSnapshot", machineHealthSnapshotSchema);
