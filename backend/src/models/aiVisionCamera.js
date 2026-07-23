import mongoose from "mongoose";

const aiVisionCameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    areaId: {
      type: String,
      default: "",
      index: true,
    },
    machineId: {
      type: String,
      default: "",
      index: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    streamUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "offline", "degraded", "maintenance"],
      default: "online",
      index: true,
    },
    enabledDetections: {
      type: [String],
      enum: ["PPE", "FIRE", "SMOKE", "INTRUSION"],
      default: ["PPE", "FIRE", "SMOKE", "INTRUSION"],
    },
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    lastSeenAt: Date,
    lastEventAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

aiVisionCameraSchema.index({ plantId: 1, status: 1, updatedAt: -1 });
aiVisionCameraSchema.index({ tenantId: 1, areaId: 1, cameraId: 1 });

export default mongoose.model("AIVisionCamera", aiVisionCameraSchema);
