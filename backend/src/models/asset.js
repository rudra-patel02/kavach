import mongoose from "mongoose";

export const ASSET_LIFECYCLE_STATES = [
  "Installed",
  "Commissioned",
  "Operational",
  "Maintenance",
  "Repair",
  "Upgrade",
  "Retirement",
  "Replacement",
];

const lifecycleEventSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: ASSET_LIFECYCLE_STATES,
      required: true,
    },
    actor: {
      type: String,
      default: "System",
    },
    notes: {
      type: String,
      default: "",
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
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
    regionId: {
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
      default: "",
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    assetId: {
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
    serialNumber: {
      type: String,
      default: "",
      index: true,
    },
    manufacturer: {
      type: String,
      default: "",
      index: true,
    },
    model: {
      type: String,
      default: "",
    },
    installationDate: Date,
    warrantyExpiry: Date,
    criticality: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },
    expectedLifeYears: {
      type: Number,
      default: 10,
    },
    assetValue: {
      type: Number,
      default: 0,
    },
    maintenanceCost: {
      type: Number,
      default: 0,
    },
    replacementCost: {
      type: Number,
      default: 0,
    },
    currentStatus: {
      type: String,
      enum: ["Running", "Warning", "Critical", "Offline", "Idle", "Maintenance"],
      default: "Running",
      index: true,
    },
    assetImage: {
      type: String,
      default: "",
    },
    qrCode: {
      type: String,
      default: "",
      index: true,
    },
    barcode: {
      type: String,
      default: "",
      index: true,
    },
    lifecycleState: {
      type: String,
      enum: ASSET_LIFECYCLE_STATES,
      default: "Operational",
      index: true,
    },
    lifecycleHistory: {
      type: [lifecycleEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

assetSchema.index({ plantId: 1, criticality: 1, currentStatus: 1 });
assetSchema.index({ organizationId: 1, lifecycleState: 1 });
assetSchema.index({ machineId: 1, updatedAt: -1 });

export default mongoose.model("Asset", assetSchema);
