import mongoose from "mongoose";

const detectionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },
    boundingBox: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const aiVisionEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    cameraId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    machineId: {
      type: String,
      default: "",
      index: true,
    },
    eventType: {
      type: String,
      enum: ["PPE", "FIRE", "SMOKE", "INTRUSION", "UNKNOWN"],
      default: "UNKNOWN",
      index: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved", "suppressed"],
      default: "open",
      index: true,
    },
    detections: {
      type: [detectionSchema],
      default: [],
    },
    snapshotUrl: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "edge-ai",
      trim: true,
    },
    observedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

aiVisionEventSchema.index({ plantId: 1, severity: 1, observedAt: -1 });
aiVisionEventSchema.index({ tenantId: 1, status: 1, observedAt: -1 });

export default mongoose.model("AIVisionEvent", aiVisionEventSchema);
