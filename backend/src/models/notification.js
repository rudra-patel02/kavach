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
        "failure_probability",
        "machine_health",
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
      required: true,
      index: true,
    },
    machineName: {
      type: String,
      required: true,
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
      required: true,
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
    dedupeKey: {
      type: String,
      required: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ dedupeKey: 1, createdAt: -1 });
notificationSchema.index({ machineId: 1, severity: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
