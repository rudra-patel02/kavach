import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      default: "",
      index: true,
    },
    userId: {
      type: String,
      default: "",
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
      index: true,
    },
    role: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    sessionId: {
      type: String,
      default: "",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
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
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ["Info", "Warning", "Critical"],
      default: "Info",
      index: true,
    },
    retentionExpiresAt: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ retentionExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("AuditLog", auditLogSchema);
