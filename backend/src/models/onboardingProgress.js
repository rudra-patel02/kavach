import mongoose from "mongoose";

export const ONBOARDING_STEPS = [
  "organization",
  "plant",
  "machines",
  "csvImport",
  "team",
  "aiConfiguration",
  "dashboardReady",
];

const onboardingProgressSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    currentStep: {
      type: String,
      enum: ONBOARDING_STEPS,
      default: "organization",
      index: true,
    },
    completedSteps: {
      type: [String],
      default: [],
    },
    stepData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    demoDataEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["In Progress", "Completed", "Blocked"],
      default: "In Progress",
      index: true,
    },
    lastAutosavedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

onboardingProgressSchema.index({ tenantId: 1, organizationId: 1 }, { unique: true });

export default mongoose.model("OnboardingProgress", onboardingProgressSchema);
