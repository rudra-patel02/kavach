import mongoose from "mongoose";

const aiHistorySchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      enum: [
        "prediction",
        "anomaly",
        "root_cause",
        "forecast",
        "maintenance_plan",
        "recommendation",
        "health_snapshot",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },
    summary: {
      type: String,
      default: "",
    },
    payload: {
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

aiHistorySchema.index({ machineId: 1, timestamp: -1 });
aiHistorySchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model("AIHistory", aiHistorySchema);
