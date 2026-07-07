import mongoose from "mongoose";

// A threshold breach on a machine metric. At most one *active* alert exists per
// (machineId, metric) at a time — status open/acknowledged — so repeated
// breaches of the same metric don't spam duplicates. When the metric returns to
// normal the active alert is resolved (cleared); a later breach opens a fresh
// one.
const alertSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    metric: {
      type: String,
      required: true,
    },
    breachValue: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
    },
    severity: {
      type: String,
      enum: ["Warning", "Critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved"],
      default: "open",
      index: true,
    },
    ts: {
      type: Date,
      required: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: String,
      default: "",
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ machineId: 1, metric: 1, status: 1 });
alertSchema.index({ status: 1, ts: -1 });

export default mongoose.model("Alert", alertSchema);
