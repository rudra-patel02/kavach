import mongoose from "mongoose";

const connectionLogSchema = new mongoose.Schema(
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
    event: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      default: "unknown",
      index: true,
    },
    message: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

connectionLogSchema.index({ createdAt: -1 });

export default mongoose.model("ConnectionLog", connectionLogSchema);
