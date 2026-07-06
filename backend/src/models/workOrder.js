import mongoose from "mongoose";

export const WORK_ORDER_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "COMPLETED",
  "CANCELLED",
];

export const WORK_ORDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "System",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const historySchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
    },
    from: String,
    to: String,
    actor: {
      type: String,
      default: "System",
    },
    message: String,
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const notificationSnapshotSchema = new mongoose.Schema(
  {
    notificationId: String,
    severity: String,
    title: String,
    message: String,
    createdAt: Date,
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    workOrderId: {
      type: String,
      required: true,
      unique: true,
    },
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
    assetId: {
      type: String,
      default: "",
      index: true,
    },
    machineId: {
      type: String,
      required: true,
    },
    machineName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "Production",
      index: true,
    },
    priority: {
      type: String,
      enum: WORK_ORDER_PRIORITIES,
      default: "MEDIUM",
      index: true,
    },
    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: WORK_ORDER_STATUSES,
      default: "OPEN",
      index: true,
    },
    assignedEngineer: {
      type: String,
      default: "",
      index: true,
    },
    createdBy: {
      type: String,
      default: "System",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    maintenanceType: {
      type: String,
      enum: ["Preventive", "Corrective", "Predictive", "Emergency", "Inspection"],
      default: "Predictive",
      index: true,
    },
    probableCause: {
      type: String,
      default: "",
    },
    aiRecommendation: {
      type: String,
      default: "",
    },
    estimatedDowntimeHours: {
      type: Number,
      default: 0,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    estimatedRepairCost: {
      type: Number,
      default: 0,
    },
    costEstimate: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
    },
    requiredParts: {
      type: [
        {
          partNumber: String,
          name: String,
          quantity: Number,
          status: {
            type: String,
            enum: ["Required", "Reserved", "Issued", "Consumed"],
            default: "Required",
          },
          estimatedCost: Number,
        },
      ],
      default: [],
    },
    approvalWorkflow: {
      requestedBy: String,
      approvedBy: String,
      approvedAt: Date,
      status: {
        type: String,
        enum: ["Not Required", "Pending", "Approved", "Rejected"],
        default: "Not Required",
        index: true,
      },
      comments: String,
    },
    maintenanceChecklist: {
      type: [
        {
          label: String,
          completed: {
            type: Boolean,
            default: false,
          },
          completedBy: String,
          completedAt: Date,
        },
      ],
      default: [],
    },
    completionNotes: {
      type: String,
      default: "",
    },
    dueDate: Date,
    scheduledDate: Date,
    completedAt: Date,
    completedDate: Date,
    approvalStatus: {
      type: String,
      enum: ["Not Required", "Pending", "Approved", "Rejected"],
      default: "Not Required",
      index: true,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    history: {
      type: [historySchema],
      default: [],
    },
    notificationHistory: {
      type: [notificationSnapshotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

workOrderSchema.index(
  { machineId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"] },
    },
  }
);
workOrderSchema.index({ createdAt: -1 });
workOrderSchema.index({ dueDate: 1 });
workOrderSchema.index({ organizationId: 1, plantId: 1, status: 1 });

export default mongoose.model("WorkOrder", workOrderSchema);
