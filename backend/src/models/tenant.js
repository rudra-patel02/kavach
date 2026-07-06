import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
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
    domain: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      default: "Industrial Manufacturing",
    },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Inactive"],
      default: "Active",
      index: true,
    },
    subscriptionTier: {
      type: String,
      enum: ["Enterprise", "Business", "Trial"],
      default: "Enterprise",
    },
    dataResidency: {
      type: String,
      default: "India",
      index: true,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

tenantSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Tenant", tenantSchema);
