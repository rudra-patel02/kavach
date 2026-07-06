import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    industry: {
      type: String,
      default: "Industrial Manufacturing",
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

export default mongoose.model("Organization", organizationSchema);
