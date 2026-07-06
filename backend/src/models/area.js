import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    productionLineId: {
      type: String,
      default: "",
      index: true,
    },
    areaId: {
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
    type: {
      type: String,
      enum: ["Process", "Utility", "Packaging", "Warehouse", "Safety", "Other"],
      default: "Process",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
      index: true,
    },
  },
  { timestamps: true }
);

areaSchema.index({ plantId: 1, productionLineId: 1, status: 1 });

export default mongoose.model("Area", areaSchema);
