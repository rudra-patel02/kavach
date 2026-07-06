import mongoose from "mongoose";

const shiftScheduleSchema = new mongoose.Schema(
  {
    day: String,
    start: String,
    end: String,
    plantId: String,
  },
  { _id: false }
);

const engineerSchema = new mongoose.Schema(
  {
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
    engineerId: {
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "Maintenance",
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    availability: {
      type: String,
      enum: ["Available", "Busy", "Off Shift", "On Leave"],
      default: "Available",
      index: true,
    },
    shiftSchedule: {
      type: [shiftScheduleSchema],
      default: [],
    },
    currentTasks: {
      type: [String],
      default: [],
    },
    performanceMetrics: {
      completedWorkOrders: {
        type: Number,
        default: 0,
      },
      averageResolutionHours: {
        type: Number,
        default: 0,
      },
      firstTimeFixRate: {
        type: Number,
        default: 0,
      },
      safetyScore: {
        type: Number,
        default: 100,
      },
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

engineerSchema.index({ plantId: 1, availability: 1, skills: 1 });
engineerSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model("Engineer", engineerSchema);
