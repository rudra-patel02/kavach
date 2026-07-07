import mongoose from "mongoose";

// A per-metric threshold. Any bound may be omitted for one-sided metrics
// (e.g. temperature only has upper bounds; oilLevel only has lower bounds).
// Severity precedence: a value crossing a crit* bound is Critical; otherwise
// crossing a warn* bound is a Warning.
const thresholdSchema = new mongoose.Schema(
  {
    metric: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      default: "",
    },
    warnMin: Number,
    warnMax: Number,
    critMin: Number,
    critMax: Number,
  },
  { _id: false }
);

// Clean, in-scope Machine for the rebuild (see build-spec.md): identity +
// location + per-metric thresholds, plus a derived healthScore/status that the
// health engine recomputes from readings. All the legacy AI/enterprise fields
// were intentionally dropped in the scope reset.
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

    location: {
      type: String,
      default: "",
    },

    // The device shared-secret authenticates at the broker/ingest boundary,
    // not per-machine; this only maps a device to the machine it feeds.
    linkedDeviceId: {
      type: String,
      default: "",
      index: true,
    },

    thresholds: {
      type: [thresholdSchema],
      default: [],
    },

    // Rated output in units/hour — the "ideal" rate for the Part 3 OEE
    // performance factor. 0/undefined means OEE performance can't be computed
    // for this machine (it's flagged incomplete rather than faked).
    ratedThroughput: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Derived — recomputed by services/health.js from the latest readings.
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["Running", "Warning", "Critical", "Offline"],
      default: "Running",
      index: true,
    },

    lastReadingAt: Date,

    lastReadingSource: {
      type: String,
      enum: ["device", "sim"],
    },
  },
  {
    timestamps: true,
  }
);

machineSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("Machine", machineSchema);
