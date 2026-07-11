import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    regionId: {
      type: String,
      default: "",
      index: true,
    },
    country: {
      type: String,
      default: "India",
      index: true,
    },
    plantId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    latitude: Number,
    longitude: Number,
    plantManager: {
      type: String,
      default: "",
    },
    capacityUnitsPerDay: {
      type: Number,
      default: 0,
    },
    timezone: {
      type: String,
      default: "Asia/Calcutta",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
      index: true,
    },
    settings: {
      oeeTarget: {
        type: Number,
        default: 85,
      },
      energyTargetKwh: {
        type: Number,
        default: 0,
      },
      shiftPattern: {
        type: String,
        default: "24x7",
      },
      safetyStockDays: {
        type: Number,
        default: 14,
      },
    },
  },
  { timestamps: true }
);

plantSchema.index({ organizationId: 1, status: 1 });
plantSchema.index({ regionId: 1, country: 1, status: 1 });
plantSchema.index({
  name: "text",
  plantId: "text",
  country: "text",
  location: "text",
  plantManager: "text",
});

export default mongoose.model("Plant", plantSchema);
