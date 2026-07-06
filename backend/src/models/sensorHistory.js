import mongoose from "mongoose";

const sensorHistorySchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    sensor: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["mqtt", "rest", "simulator", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

sensorHistorySchema.index({ machineId: 1, sensor: 1, timestamp: -1 });

export default mongoose.model("SensorHistory", sensorHistorySchema);
