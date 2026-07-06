import mongoose from "mongoose";

const productionLineSchema = new mongoose.Schema(
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
    departmentId: {
      type: String,
      default: "",
      index: true,
    },
    lineId: {
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
    status: {
      type: String,
      enum: ["Running", "Idle", "Maintenance"],
      default: "Running",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProductionLine", productionLineSchema);
