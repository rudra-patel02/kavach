import mongoose from "mongoose";

// The v1 work-order lifecycle is a strict forward chain (see build-spec.md /
// CLAUDE.md): a work order is created (Open), assigned to an engineer
// (Assigned), worked (In Progress) and closed (Resolved). Transitions are
// forward-only and single-step; the enforcement lives in services/workOrders.js.
export const WORK_ORDER_STATUSES = ["Open", "Assigned", "In Progress", "Resolved"];

// A work order still occupying the machine (not yet Resolved). At most one of
// these may exist per machine at a time — enforced both in the controller and
// by the partial unique index below.
export const ACTIVE_WORK_ORDER_STATUSES = ["Open", "Assigned", "In Progress"];

export const WORK_ORDER_PRIORITIES = ["Low", "Medium", "High", "Critical"];

// Immutable audit trail of who moved the work order and when — satisfies the
// "who/when is recorded" requirement without a separate audit surface.
const historySchema = new mongoose.Schema(
  {
    from: { type: String, default: "" },
    to: { type: String, required: true },
    by: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Clean, in-scope WorkOrder for the rebuild (replaces the ~30-field legacy
// model). Only the fields the spec's data model lists, plus a derived
// resolvedAt (drives Part 3 MTTR) and the transition history. createdBy /
// machineId / linkedAlertId are set server-side at creation and NEVER accepted
// from an update body (mass-assignment guard in the controller).
const workOrderSchema = new mongoose.Schema(
  {
    // Not indexed at the field level: the partial unique index below already
    // covers { machineId: 1 }; a second same-key index conflicts on build.
    machineId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: WORK_ORDER_PRIORITIES,
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: WORK_ORDER_STATUSES,
      default: "Open",
      index: true,
    },
    // The engineer this work order is assigned to (a User _id as a string). Only
    // a Manager may set/change it. Empty until assigned.
    assigneeId: {
      type: String,
      default: "",
      index: true,
    },
    // The user who created the work order (a Manager). Server-owned.
    createdBy: {
      type: String,
      required: true,
    },
    // The alert that triggered this work order, if any — the "closed loop" link.
    linkedAlertId: {
      type: String,
      default: "",
    },
    // Set when the work order reaches Resolved. createdAt→resolvedAt is the
    // repair interval the KPI engine averages into MTTR.
    resolvedAt: {
      type: Date,
    },
    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// At most one active (not-yet-Resolved) work order per machine. A partial unique
// index is the DB-level backstop; the controller checks first for a clean 409.
workOrderSchema.index(
  { machineId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_WORK_ORDER_STATUSES } },
  }
);
workOrderSchema.index({ assigneeId: 1, status: 1 });
workOrderSchema.index({ createdAt: -1 });

export default mongoose.model("WorkOrder", workOrderSchema);
