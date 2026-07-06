import mongoose from "mongoose";

const rootCauseItemSchema = new mongoose.Schema(
  {
    cause: String,
    probability: Number,
    explanation: String,
    correctiveActions: {
      type: [String],
      default: [],
    },
    evidence: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const rootCauseSchema = new mongoose.Schema(
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
    summary: {
      type: String,
      default: "",
      index: true,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    causes: {
      type: [rootCauseItemSchema],
      default: [],
    },
    sensorSignature: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    anomalyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anomaly",
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

rootCauseSchema.index({ machineId: 1, timestamp: -1 });
rootCauseSchema.index({ summary: 1, timestamp: -1 });

export default mongoose.model("RootCause", rootCauseSchema);
