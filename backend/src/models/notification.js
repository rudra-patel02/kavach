import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "failure_probability",
        "machine_health",
        "temperature",
        "vibration",
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
    icon: {
      type: String,
      required: true,
    },
    value: Number,
    threshold: Number,
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

export default mongoose.model("Notification", notificationSchema);
