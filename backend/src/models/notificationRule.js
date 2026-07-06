import mongoose from "mongoose";

const escalationStepSchema = new mongoose.Schema(
  {
    afterMinutes: {
      type: Number,
      default: 15,
    },
    role: {
      type: String,
      default: "Maintenance Manager",
    },
    channel: {
      type: String,
      enum: ["email", "sms", "push", "slack", "teams", "webhook"],
      default: "email",
    },
  },
  { _id: false }
);

const notificationRuleSchema = new mongoose.Schema(
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
    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "High",
      index: true,
    },
    channels: {
      type: [String],
      enum: ["email", "sms", "push", "slack", "teams", "webhook"],
      default: ["email", "push"],
    },
    webhookUrl: {
      type: String,
      default: "",
    },
    quietHours: {
      start: {
        type: String,
        default: "",
      },
      end: {
        type: String,
        default: "",
      },
      timezone: {
        type: String,
        default: "Asia/Calcutta",
      },
    },
    retryPolicy: {
      maxRetries: {
        type: Number,
        default: 3,
      },
      backoffMinutes: {
        type: Number,
        default: 5,
      },
    },
    escalationPolicy: {
      type: [escalationStepSchema],
      default: [],
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

notificationRuleSchema.index({ organizationId: 1, severity: 1, enabled: 1 });

export default mongoose.model("NotificationRule", notificationRuleSchema);
