import mongoose from "mongoose";

const machineGroupSchema = new mongoose.Schema(
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
    groupId: {
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
    machineIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("MachineGroup", machineGroupSchema);
