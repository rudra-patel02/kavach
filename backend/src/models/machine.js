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
      enum: ["Running", "Warning", "Critical", "Offline"],
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

    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },

    aiPrediction: predictionSchema,

    maintenanceHistory: {
      type: [maintenanceHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Machine", machineSchema);
