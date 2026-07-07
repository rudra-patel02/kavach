import mongoose from "mongoose";

// A single telemetry sample in tall/long time-series form: one document per
// (machine, metric, ts). A device packet with several metrics fans out into
// several Reading documents, which keeps per-metric health/history trivial.
//
// `source` is the trust label: "device" = real authenticated telemetry (the
// only thing counted as live), "sim" = dev simulator output, always flagged so
// it can never be mistaken for real data.
const readingSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: "",
    },
    metric: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "",
    },
    ts: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["device", "sim"],
      default: "device",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Newest-first lookups per machine/metric power the health recompute.
readingSchema.index({ machineId: 1, metric: 1, ts: -1 });
readingSchema.index({ machineId: 1, ts: -1 });

export default mongoose.model("Reading", readingSchema);
