import mongoose from "mongoose";

const maintenancePlanSchema = new mongoose.Schema(
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
    priority: {
      type: String,
      enum: ["Immediate", "High", "Planned", "Monitor"],
      default: "Monitor",
      index: true,
    },
    estimatedDowntimeHours: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    requiredTechnicians: {
      type: [String],
      default: [],
    },
    requiredSpareParts: {
      type: [String],
      default: [],
    },
    estimatedCompletionTime: Date,
    calendarRecommendations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    actions: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Recommended", "Scheduled", "Approved", "Completed", "Dismissed"],
      default: "Recommended",
      index: true,
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

maintenancePlanSchema.index({ machineId: 1, timestamp: -1 });
maintenancePlanSchema.index({ priority: 1, timestamp: -1 });

export default mongoose.model("MaintenancePlan", maintenancePlanSchema);
