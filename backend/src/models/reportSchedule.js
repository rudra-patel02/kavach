import mongoose from "mongoose";

const reportScheduleSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ["pdf", "excel", "csv"],
      default: "pdf",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
      index: true,
    },
    recipients: {
      type: [String],
      default: [],
    },
    emailDelivery: {
      type: Boolean,
      default: true,
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastRunAt: Date,
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

reportScheduleSchema.index({ organizationId: 1, frequency: 1, enabled: 1 });

export default mongoose.model("ReportSchedule", reportScheduleSchema);
