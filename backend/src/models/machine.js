import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    failureRisk: String,
    maintenancePriority: String,
    maintenanceInDays: Number,
    recommendation: String,
  },
  { _id: false }
);

const maintenanceHistorySchema = new mongoose.Schema(
  {
    workOrderId: String,
    status: String,
    completedAt: Date,
    summary: String,
    engineer: String,
    notes: String,
  },
  { _id: false }
);

const predictionHistorySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    failureProbability: Number,
    remainingUsefulLifeHours: Number,
    maintenancePriority: String,
    riskLevel: String,
    confidenceScore: Number,
  },
  { _id: false }
);

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "Production",
    },

    status: {
      type: String,
      enum: ["Running", "Warning", "Critical", "Offline", "Idle", "Maintenance"],
      default: "Running",
    },

    health: {
      type: Number,
      default: 100,
    },

    temperature: {
      type: Number,
      default: 25,
    },

    vibration: {
      type: Number,
      default: 0.2,
    },

    power: {
      type: Number,
      default: 0,
    },

    current: {
      type: Number,
      default: 0,
    },

    voltage: {
      type: Number,
      default: 415,
    },

    efficiency: {
      type: Number,
      default: 100,
    },

    rpm: {
      type: Number,
      default: 1500,
    },

    humidity: {
      type: Number,
      default: 45,
    },

    pressure: {
      type: Number,
      default: 1.0,
    },

    energyConsumed: {
      type: Number,
      default: 0,
    },

    downtime: {
      type: Number,
      default: 0,
    },

    oee: {
      type: Number,
      default: 100,
    },

    remainingUsefulLifeHours: {
      type: Number,
      default: 720,
    },

    predictedFailureProbability: {
      type: Number,
      default: 2,
    },

    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },

    aiPrediction: predictionSchema,

    predictionHistory: {
      type: [predictionHistorySchema],
      default: [],
    },

    maintenanceHistory: {
      type: [maintenanceHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

machineSchema.index({ department: 1, status: 1 });
machineSchema.index({ health: 1 });
machineSchema.index({ updatedAt: -1 });

export default mongoose.model("Machine", machineSchema);
