import mongoose from "mongoose";

const usefulLifeSchema = new mongoose.Schema(
  {
    remainingDays: Number,
    remainingHours: Number,
    risk: Number,
    riskPercent: Number,
    health: Number,
    healthPercent: Number,
    confidence: Number,
    confidencePercent: Number,
    operatingHours: Number,
    loadPercent: Number,
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
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
    confidencePercent: {
      type: Number,
      default: 0,
    },
    remainingUsefulLife: usefulLifeSchema,
    forecast: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rootCauseSummary: {
      type: String,
      default: "",
    },
    recommendations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    anomalyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anomaly",
    },
    rootCauseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RootCause",
    },
    forecastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forecast",
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

predictionSchema.index({ machineId: 1, timestamp: -1 });
predictionSchema.index({ riskPercent: -1, timestamp: -1 });

export default mongoose.model("Prediction", predictionSchema);
