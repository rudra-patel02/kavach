import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    organizationCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      default: "Industrial Manufacturing",
    },
    headquartersCountry: {
      type: String,
      default: "India",
      index: true,
    },
    headquartersRegion: {
      type: String,
      default: "",
      index: true,
    },
    timezone: {
      type: String,
      default: "Asia/Calcutta",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  { timestamps: true }
);

organizationSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model("Organization", organizationSchema);
