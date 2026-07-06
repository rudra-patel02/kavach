import mongoose from "mongoose";

const fleetAnalyticsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    organizationId: {
      type: String,
      default: "",
      index: true,
    },
    plantId: {
      type: String,
      default: "",
      index: true,
    },
    period: {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly"],
      default: "daily",
      index: true,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    plantComparison: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    machineComparison: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

fleetAnalyticsSchema.index({ organizationId: 1, period: 1, generatedAt: -1 });
fleetAnalyticsSchema.index({ plantId: 1, period: 1, generatedAt: -1 });

export default mongoose.model("FleetAnalytics", fleetAnalyticsSchema);
