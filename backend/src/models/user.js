import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "Admin",
        "Super Admin",
        "Plant Admin",
        "Plant Manager",
        "Maintenance Manager",
        "Engineer",
        "Maintenance Engineer",
        "Operator",
        "Viewer",
      ],
      default: "Viewer",
    },

    department: {
      type: String,
      default: "Production",
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      default: "",
    },

    organizationId: {
      type: String,
      default: "",
      index: true,
    },

    plantIds: {
      type: [String],
      default: [],
      index: true,
    },

    activePlantId: {
      type: String,
      default: "",
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    permissions: [
      {
        type: String,
      },
    ],

    refreshToken: {
      type: String,
      select: false,
      default: "",
    },

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      criticalAlerts: {
        type: Boolean,
        default: true,
      },
      weeklyReports: {
        type: Boolean,
        default: true,
      },
    },

    themePreference: {
      type: String,
      enum: ["dark", "system"],
      default: "dark",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
