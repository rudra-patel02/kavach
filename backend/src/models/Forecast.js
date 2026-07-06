import mongoose from "mongoose";

const failureProbabilitySchema = new mongoose.Schema(
  {
    motorFailure: Number,
    bearingFailure: Number,
    pumpFailure: Number,
    hydraulicFailure: Number,
    electricalFailure: Number,
    coolingFailure: Number,
  },
  { _id: false }
);

const forecastHorizonSchema = new mongoose.Schema(
  {
    horizon: String,
    key: String,
    multiplier: Number,
    probabilities: failureProbabilitySchema,
  },
  { _id: false }
);

const forecastSchema = new mongoose.Schema(
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
    confidence: {
      type: Number,
      default: 0,
    },
    peakProbability: {
      type: Number,
      default: 0,
      index: true,
    },
    horizons: {
      type: [forecastHorizonSchema],
      default: [],
    },
    probabilityChart: {
      type: [mongoose.Schema.Types.Mixed],
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

forecastSchema.index({ machineId: 1, timestamp: -1 });
forecastSchema.index({ peakProbability: -1, timestamp: -1 });

export default mongoose.model("Forecast", forecastSchema);
