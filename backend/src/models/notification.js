import mongoose from "mongoose";

const alertTimelineSchema = new mongoose.Schema(
  {
    event: String,
    at: {
      type: Date,
      default: Date.now,
    },
    actor: {
      type: String,
      default: "KAVACH Alert Engine",
    },
    message: String,
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "critical_alert",
        "failure_probability",
        "machine_failure",
        "machine_health",
        "maintenance_due",
        "ai_recommendation",
        "production_delay",
        "energy_spike",
        "safety_warning",
        "quality_issue",
        "inventory_alert",
        "temperature",
        "vibration",
        "pressure",
        "power",
        "maintenance",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      required: true,
      index: true,
    },
    machineId: {
      type: String,
      default: "",
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
    assetId: {
      type: String,
      default: "",
      index: true,
    },
    machineName: {
      type: String,
      default: "Plant-wide",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "bell",
    },
    category: {
      type: String,
      default: "",
      index: true,
    },
    value: Number,
    threshold: Number,
    priority: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      default: "P4",
      index: true,
    },
    failureProbability: {
      type: Number,
      default: 0,
    },
    suggestedAction: {
      type: String,
      default: "",
    },
    estimatedDowntimeHours: {
      type: Number,
      default: 0,
    },
    recommendedEngineer: {
      type: String,
      default: "",
      index: true,
    },
    machineLocation: {
      type: String,
      default: "",
    },
    alertTimeline: {
      type: [alertTimelineSchema],
      default: [],
    },
    alertHistory: {
      type: [alertTimelineSchema],
      default: [],
    },
    owner: {
      type: String,
      default: "",
      index: true,
    },
    escalationLevel: {
      type: Number,
      default: 0,
      index: true,
    },
    escalationStatus: {
      type: String,
      enum: ["Open", "Escalated", "Resolved", "Muted"],
      default: "Open",
      index: true,
    },
    comments: {
      type: [
        {
          text: String,
          author: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    channels: {
      type: [String],
      default: ["push"],
    },
    deliveryAttempts: {
      type: [
        {
          channel: String,
          status: String,
          attemptedAt: {
            type: Date,
            default: Date.now,
          },
          error: String,
        },
      ],
      default: [],
    },
    dedupeKey: {
      type: String,
      default: "",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ dedupeKey: 1, createdAt: -1 });
notificationSchema.index({ machineId: 1, severity: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, plantId: 1, read: 1, severity: 1 });

export default mongoose.model("Notification", notificationSchema);
