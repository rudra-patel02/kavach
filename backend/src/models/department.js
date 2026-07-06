import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
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
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    manager: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
