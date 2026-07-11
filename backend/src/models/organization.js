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
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    branding: {
      logoUrl: {
        type: String,
        default: "",
      },
      primaryColor: {
        type: String,
        default: "#0891b2",
      },
      accentColor: {
        type: String,
        default: "#22c55e",
      },
      theme: {
        type: String,
        enum: ["dark", "system"],
        default: "dark",
      },
    },
    license: {
      plan: {
        type: String,
        enum: ["Starter", "Professional", "Enterprise"],
        default: "Enterprise",
      },
      seats: {
        type: Number,
        default: 50,
      },
      machineLimit: {
        type: Number,
        default: 500,
      },
      expiresAt: Date,
    },
    onboarding: {
      status: {
        type: String,
        enum: ["Not Started", "In Progress", "Completed"],
        default: "Not Started",
        index: true,
      },
      completedAt: Date,
    },
  },
  { timestamps: true }
);

organizationSchema.index({ tenantId: 1, status: 1 });
organizationSchema.index({
  name: "text",
  organizationCode: "text",
  industry: "text",
  headquartersCountry: "text",
});

export default mongoose.model("Organization", organizationSchema);
