import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      default: "",
      index: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ["starter", "professional", "enterprise"],
      index: true,
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "cancelled", "expired"],
      default: "trialing",
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    usage: {
      machines: {
        type: Number,
        default: 0,
      },
      users: {
        type: Number,
        default: 0,
      },
      plants: {
        type: Number,
        default: 0,
      },
      apiCalls: {
        type: Number,
        default: 0,
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ tenantId: 1, status: 1, currentPeriodEnd: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
