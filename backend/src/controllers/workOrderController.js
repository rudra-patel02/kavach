import mongoose from "mongoose";

import Machine from "../models/machine.js";
import User from "../models/user.js";
import WorkOrder, { WORK_ORDER_PRIORITIES } from "../models/workOrder.js";
import { emitEvent } from "../socket/index.js";
import { SOCKET_EVENTS } from "../socket/events.js";
import {
  findActiveWorkOrderForMachine,
  isValidTransition,
  scopeForUser,
  serializeWorkOrder,
} from "../services/workOrders.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

// Resolve an assignee reference from a request body value: validates it is a
// real user and returns their id, or an error string. Assignees are expected to
// be Engineers (that's who the UI offers) but we only require the user exists —
// the meaningful invariant is that the link points at a real person.
const resolveAssignee = async (raw) => {
  const id = String(raw || "").trim();
  if (!mongoose.isValidObjectId(id)) {
    return { error: "Invalid assignee id" };
  }
  const user = await User.findById(id).lean();
  if (!user) {
    return { error: "Assignee not found" };
  }
  return { assigneeId: String(user._id) };
};

// GET /api/workorders — list scoped to the caller. Engineers see only their own
// assignments; Manager/Viewer see the whole plant. Optional status/machine
// filters narrow further.
export const listWorkOrders = async (req, res) => {
  try {
    const filters = { ...scopeForUser(req.user) };

    if (req.query.status) {
      filters.status = String(req.query.status);
    }
    if (req.query.machineId) {
      filters.machineId = String(req.query.machineId);
    }
    // Managers/Viewers may narrow by assignee; an Engineer is already scoped to
    // themselves, so this filter can never widen their view.
    if (req.query.assigneeId && req.user.role !== "Engineer") {
      filters.assigneeId = String(req.query.assigneeId);
    }

    const workOrders = await WorkOrder.find(filters).sort({ createdAt: -1 }).lean();

    res.json({ success: true, workOrders: workOrders.map(serializeWorkOrder) });
  } catch (error) {
    console.error("Failed to list work orders:", error.message);
    res.status(500).json({ success: false, message: "Failed to list work orders" });
  }
};

// GET /api/workorders/:id — single work order, scoped to the caller. A work
// order outside the caller's scope reads as not-found (no existence leak).
export const getWorkOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Work order not found" });
    }

    const workOrder = await WorkOrder.findOne({
      _id: req.params.id,
      ...scopeForUser(req.user),
    }).lean();

    if (!workOrder) {
      return res.status(404).json({ success: false, message: "Work order not found" });
    }

    res.json({ success: true, workOrder: serializeWorkOrder(workOrder) });
  } catch (error) {
    console.error("Failed to load work order:", error.message);
    res.status(500).json({ success: false, message: "Failed to load work order" });
  }
};

// POST /api/workorders — Manager creates + (optionally) assigns a work order for
// a machine, linked to the alert that triggered it. Only whitelisted fields are
// read; createdBy comes from the token, never the body.
export const createWorkOrder = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const machineId = String(req.body.machineId || "").trim();

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!machineId) {
      return res.status(400).json({ success: false, message: "machineId is required" });
    }

    const machine = await Machine.findOne({ machineId }).lean();
    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }

    // One active work order per machine.
    const active = await findActiveWorkOrderForMachine(machineId);
    if (active) {
      return res.status(409).json({
        success: false,
        message: "An active work order already exists for this machine",
      });
    }

    const priority = WORK_ORDER_PRIORITIES.includes(req.body.priority)
      ? req.body.priority
      : "Medium";
    const description = String(req.body.description || "");
    const linkedAlertId = isNonEmptyString(req.body.linkedAlertId)
      ? String(req.body.linkedAlertId).trim()
      : "";

    let assigneeId = "";
    let status = "Open";
    if (isNonEmptyString(req.body.assigneeId)) {
      const resolved = await resolveAssignee(req.body.assigneeId);
      if (resolved.error) {
        return res.status(400).json({ success: false, message: resolved.error });
      }
      assigneeId = resolved.assigneeId;
      status = "Assigned"; // create + assign in one step (DoD)
    }

    const createdBy = String(req.user.id);
    const now = new Date();

    const workOrder = await WorkOrder.create({
      machineId,
      title,
      description,
      priority,
      status,
      assigneeId,
      linkedAlertId,
      createdBy,
      history: [{ from: "", to: status, by: createdBy, at: now }],
    });

    const serialized = serializeWorkOrder(workOrder);
    emitEvent(SOCKET_EVENTS.WORKORDER_UPDATE, serialized);

    res.status(201).json({ success: true, workOrder: serialized });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An active work order already exists for this machine",
      });
    }
    console.error("Failed to create work order:", error.message);
    res.status(500).json({ success: false, message: "Failed to create work order" });
  }
};

// PATCH /api/workorders/:id — advance / update a work order. Reachable by
// Manager or Engineer (Viewer is blocked by permission middleware). An Engineer
// may only advance work orders assigned to them and only the status; a Manager
// may also (re)assign and edit metadata. createdBy / machineId / linkedAlertId
// are never read from the body.
export const updateWorkOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Work order not found" });
    }

    // Scoped load: an Engineer can only reach their own work orders; anything
    // else is not-found for them.
    const workOrder = await WorkOrder.findOne({
      _id: req.params.id,
      ...scopeForUser(req.user),
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: "Work order not found" });
    }

    const isManager = req.user.role === "Manager";
    const actor = String(req.user.id);
    const now = new Date();

    // --- assignment + metadata (Manager only) --------------------------------
    // Engineers' attempts to set these are silently ignored (mass-assignment
    // philosophy: never trust owner fields from the body).
    if (isManager) {
      if (req.body.assigneeId !== undefined) {
        const resolved = await resolveAssignee(req.body.assigneeId);
        if (resolved.error) {
          return res.status(400).json({ success: false, message: resolved.error });
        }
        workOrder.assigneeId = resolved.assigneeId;
        // Assigning an Open work order advances it to Assigned.
        if (workOrder.status === "Open") {
          workOrder.history.push({ from: "Open", to: "Assigned", by: actor, at: now });
          workOrder.status = "Assigned";
        }
      }

      if (WORK_ORDER_PRIORITIES.includes(req.body.priority)) {
        workOrder.priority = req.body.priority;
      }
      if (isNonEmptyString(req.body.title)) {
        workOrder.title = String(req.body.title).trim();
      }
      if (typeof req.body.description === "string") {
        workOrder.description = req.body.description;
      }
    }

    // --- status transition (Manager + Engineer) ------------------------------
    if (req.body.status !== undefined && req.body.status !== workOrder.status) {
      const to = String(req.body.status);

      if (!isValidTransition(workOrder.status, to)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition: ${workOrder.status} → ${to}`,
        });
      }

      // A work order can only become Assigned once it actually has an assignee.
      if (to === "Assigned" && !workOrder.assigneeId) {
        return res.status(400).json({
          success: false,
          message: "Assign an engineer before moving to Assigned",
        });
      }

      workOrder.history.push({ from: workOrder.status, to, by: actor, at: now });
      workOrder.status = to;
      if (to === "Resolved") {
        workOrder.resolvedAt = now;
      }
    }

    await workOrder.save();

    const serialized = serializeWorkOrder(workOrder);
    emitEvent(SOCKET_EVENTS.WORKORDER_UPDATE, serialized);
    // A resolution changes the machine's MTTR, so nudge KPI subscribers too.
    if (workOrder.status === "Resolved") {
      emitEvent(SOCKET_EVENTS.KPI_UPDATE, { machineId: workOrder.machineId });
    }

    res.json({ success: true, workOrder: serialized });
  } catch (error) {
    console.error("Failed to update work order:", error.message);
    res.status(500).json({ success: false, message: "Failed to update work order" });
  }
};
