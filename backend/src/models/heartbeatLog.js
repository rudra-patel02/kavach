import mongoose from "mongoose";

const heartbeatLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    machineId: {
      type: String,
      default: "",
      index: true,
    },
    batteryLevel: Number,
    signalStrength: Number,
    healthStatus: {
      type: String,
      default: "unknown",
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["mqtt", "rest", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

heartbeatLogSchema.index({ deviceId: 1, timestamp: -1 });

export default mongoose.model("HeartbeatLog", heartbeatLogSchema);
