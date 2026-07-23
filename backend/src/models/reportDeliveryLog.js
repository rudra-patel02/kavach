import mongoose from "mongoose";

const reportDeliveryLogSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      index: true,
    },
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
    reportId: {
      type: String,
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ["pdf", "excel", "csv", "json"],
      default: "pdf",
    },
    recipients: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["queued", "delivered", "failed"],
      default: "queued",
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deliveredAt: Date,
    error: {
      type: String,
      default: "",
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

reportDeliveryLogSchema.index({ tenantId: 1, generatedAt: -1 });
reportDeliveryLogSchema.index({ scheduleId: 1, generatedAt: -1 });

export default mongoose.model("ReportDeliveryLog", reportDeliveryLogSchema);
