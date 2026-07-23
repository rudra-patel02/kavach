import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
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
    keys: {
      auth: {
        type: String,
        required: true,
      },
      p256dh: {
        type: String,
        required: true,
      },
    },
    userAgent: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "expired", "disabled"],
      default: "active",
      index: true,
    },
    lastDeliveredAt: Date,
    lastFailedAt: Date,
    lastError: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ tenantId: 1, status: 1, updatedAt: -1 });
pushSubscriptionSchema.index({ userId: 1, status: 1 });

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
