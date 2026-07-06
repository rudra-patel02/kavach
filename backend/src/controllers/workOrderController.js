import mongoose from "mongoose";

import WorkOrder from "../models/workOrder.js";
import { createAuditLog } from "../services/auditService.js";
import {
  createManualWorkOrder,
  deleteWorkOrder,
  getRecentNotificationsForMachine,
  getWorkOrderByIdentifier,
  serializeWorkOrder,
  updateWorkOrder,
} from "../services/workOrderService.js";
import { createSimplePdf, toCsv } from "../utils/exportUtils.js";

const getIo = (req) => req.app.get("io");
const ACTIVE_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"];

const buildQuery = (query) => {
  const filters = {};

  for (const field of [
    "status",
    "priority",
    "department",
    "assignedEngineer",
    "maintenanceType",
    "approvalStatus",
  ]) {
    if (query[field]) {
      filters[field] = String(query[field]);
    }
  }

  if (query.search) {
    const search = String(query.search).trim();
    filters.$or = [
      { workOrderId: new RegExp(search, "i") },
      { machineId: new RegExp(search, "i") },
      { machineName: new RegExp(search, "i") },
      { department: new RegExp(search, "i") },
      { assignedEngineer: new RegExp(search, "i") },
    ];
  }

  return filters;
};

const buildSort = (sort = "-createdAt") => {
  const sortMap = {
    priority: { priority: 1 },
    "-priority": { priority: -1 },
    status: { status: 1 },
    "-status": { status: -1 },
    engineer: { assignedEngineer: 1 },
    "-engineer": { assignedEngineer: -1 },
    department: { department: 1 },
    "-department": { department: -1 },
    scheduledDate: { scheduledDate: 1 },
    "-scheduledDate": { scheduledDate: -1 },
    date: { createdAt: 1 },
    "-date": { createdAt: -1 },
    dueDate: { dueDate: 1 },
    "-dueDate": { dueDate: -1 },
  };

  return sortMap[sort] || { createdAt: -1 };
};

const getIdentifierFromRequest = (req) =>
  String(req.params.id || req.body.id || req.body.workOrderId || "").trim();

const ensureValidIdentifier = (identifier, res) => {
  if (!identifier) {
    res.status(400).json({ message: "Work order id is required" });
    return false;
  }

  if (!mongoose.isValidObjectId(identifier) && !identifier.startsWith("WO-")) {
    res.status(400).json({ message: "Invalid work order id" });
    return false;
  }

  return true;
};

const loadWorkOrderForMutation = async (req, res) => {
  const identifier = getIdentifierFromRequest(req);

  if (!ensureValidIdentifier(identifier, res)) {
    return null;
  }

  const workOrder = await getWorkOrderByIdentifier(identifier);

  if (!workOrder) {
    res.status(404).json({ message: "Work order not found" });
    return null;
  }

  return workOrder;
};

const sendWorkOrderExport = (res, format, workOrders) => {
  const serializedWorkOrders = workOrders.map(serializeWorkOrder);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const columns = [
    { header: "Work Order ID", key: "workOrderId" },
    { header: "Machine ID", key: "machineId" },
    { header: "Machine", key: "machineName" },
    { header: "Priority", key: "priority" },
    { header: "Status", key: "status" },
    { header: "Engineer", key: "assignedEngineer" },
    { header: "Created By", key: "createdBy" },
    { header: "Maintenance Type", key: "maintenanceType" },
    { header: "Estimated Hours", key: "estimatedHours" },
    { header: "Actual Hours", key: "actualHours" },
    { header: "Cost Estimate", key: "costEstimate" },
    { header: "Scheduled Date", key: "scheduledDate" },
    { header: "Completed Date", key: "completedDate" },
    { header: "Approval Status", key: "approvalStatus" },
  ];

  if (format === "pdf") {
    const lines = serializedWorkOrders.map(
      (workOrder) =>
        `${workOrder.workOrderId} | ${workOrder.machineName} | ${workOrder.priority} | ${workOrder.status} | ${workOrder.assignedEngineer || "Unassigned"}`
    );
    const pdf = createSimplePdf({
      title: "KAVACH Work Order Export",
      lines,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kavach-work-orders-${timestamp}.pdf"`
    );
    return res.send(pdf);
  }

  const csv = toCsv(serializedWorkOrders, columns);
  res.setHeader(
    "Content-Type",
    format === "excel" || format === "xlsx"
      ? "application/vnd.ms-excel; charset=utf-8"
      : "text/csv; charset=utf-8"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="kavach-work-orders-${timestamp}.csv"`
  );
  return res.send(csv);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const getWorkOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const workOrders = await WorkOrder.find(buildQuery(req.query))
      .sort(buildSort(req.query.sort))
      .limit(limit)
      .lean();

    res.json({
      success: true,
      workOrders: workOrders.map(serializeWorkOrder),
    });
  } catch (error) {
    console.error("Failed to fetch work orders:", error);
    res.status(500).json({ message: "Failed to fetch work orders" });
  }
};

export const exportWorkOrders = async (req, res) => {
  try {
    const format = String(req.params.format || req.query.format || "csv")
      .trim()
      .toLowerCase();
    const workOrders = await WorkOrder.find(buildQuery(req.query))
      .sort(buildSort(req.query.sort))
      .limit(1000)
      .lean();

    return sendWorkOrderExport(res, format, workOrders);
  } catch (error) {
    console.error("Failed to export work orders:", error);
    res.status(500).json({ message: "Failed to export work orders" });
  }
};

export const getWorkOrderStats = async (req, res) => {
  try {
    const [statusSummary, prioritySummary, overdueCount] = await Promise.all([
      WorkOrder.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            estimatedDurationHours: { $sum: "$estimatedDowntimeHours" },
          },
        },
      ]),
      WorkOrder.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),
      WorkOrder.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $in: ACTIVE_STATUSES },
      }),
    ]);
    const statusCounts = Object.fromEntries(
      statusSummary.map((item) => [item._id, item.count])
    );
    const priorityCounts = Object.fromEntries(
      prioritySummary.map((item) => [item._id, item.count])
    );
    const active = ACTIVE_STATUSES.reduce(
      (sum, status) => sum + Number(statusCounts[status] || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        pending:
          Number(statusCounts.OPEN || 0) + Number(statusCounts.ASSIGNED || 0),
        active,
        completed: Number(statusCounts.COMPLETED || 0),
        overdue: overdueCount,
        highPriority:
          Number(priorityCounts.HIGH || 0) + Number(priorityCounts.CRITICAL || 0),
        estimatedDurationHours: statusSummary.reduce(
          (sum, item) => sum + Number(item.estimatedDurationHours || 0),
          0
        ),
        byStatus: statusCounts,
        byPriority: priorityCounts,
      },
    });
  } catch (error) {
    console.error("Failed to fetch work order stats:", error);
    res.status(500).json({ message: "Failed to fetch work order statistics" });
  }
};

export const getWorkOrder = async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();

    if (!identifier) {
      return res.status(400).json({ message: "Work order id is required" });
    }

    if (!mongoose.isValidObjectId(identifier) && !identifier.startsWith("WO-")) {
      return res.status(400).json({ message: "Invalid work order id" });
    }

    const workOrder = await getWorkOrderByIdentifier(identifier).lean();

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    const recentNotifications = await getRecentNotificationsForMachine(
      workOrder.machineId
    );
    const response = serializeWorkOrder(workOrder);

    response.notificationHistory = recentNotifications.map((notification) => ({
      notificationId: String(notification._id),
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      createdAt: new Date(notification.createdAt).toISOString(),
    }));

    res.json({
      success: true,
      workOrder: response,
    });
  } catch (error) {
    console.error("Failed to fetch work order:", error);
    res.status(500).json({ message: "Failed to fetch work order" });
  }
};

export const createWorkOrder = async (req, res) => {
  try {
    const workOrder = await createManualWorkOrder(req.body, getIo(req));

    await createAuditLog({
      action: "WORK_ORDER_CREATED",
      newValue: workOrder,
      req,
      resourceId: workOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.status(201).json({
      success: true,
      workOrder,
    });
  } catch (error) {
    console.error("Failed to create work order:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create work order",
    });
  }
};

export const patchWorkOrder = async (req, res) => {
  try {
    const workOrder = await loadWorkOrderForMutation(req, res);

    if (!workOrder) return;

    const oldValue =
      typeof workOrder.toObject === "function" ? workOrder.toObject() : workOrder;
    const updatedWorkOrder = await updateWorkOrder(
      workOrder,
      req.body,
      getIo(req)
    );

    await createAuditLog({
      action: "WORK_ORDER_UPDATED",
      newValue: updatedWorkOrder,
      oldValue,
      req,
      resourceId: updatedWorkOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.json({
      success: true,
      workOrder: updatedWorkOrder,
    });
  } catch (error) {
    console.error("Failed to update work order:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update work order",
    });
  }
};

export const replaceWorkOrder = patchWorkOrder;

export const updateWorkOrderStatus = async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const workOrder = await loadWorkOrderForMutation(req, res);

    if (!workOrder) return;

    const oldValue =
      typeof workOrder.toObject === "function" ? workOrder.toObject() : workOrder;
    const updatedWorkOrder = await updateWorkOrder(
      workOrder,
      {
        actor: req.body.actor || req.user?.name || req.user?.email || "Operator",
        note: req.body.note,
        status: req.body.status,
      },
      getIo(req)
    );

    await createAuditLog({
      action: "WORK_ORDER_STATUS_CHANGED",
      newValue: updatedWorkOrder,
      oldValue,
      req,
      resourceId: updatedWorkOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.json({ success: true, workOrder: updatedWorkOrder });
  } catch (error) {
    console.error("Failed to update work order status:", error);
    res.status(500).json({ message: "Failed to update work order status" });
  }
};

export const assignWorkOrder = async (req, res) => {
  try {
    if (!req.body.assignedEngineer) {
      return res.status(400).json({ message: "Assigned engineer is required" });
    }

    const workOrder = await loadWorkOrderForMutation(req, res);

    if (!workOrder) return;

    const oldValue =
      typeof workOrder.toObject === "function" ? workOrder.toObject() : workOrder;
    const updatedWorkOrder = await updateWorkOrder(
      workOrder,
      {
        actor: req.body.actor || req.user?.name || req.user?.email || "Operator",
        assignedEngineer: req.body.assignedEngineer,
        note: req.body.note,
      },
      getIo(req)
    );

    await createAuditLog({
      action: "WORK_ORDER_ASSIGNED",
      newValue: updatedWorkOrder,
      oldValue,
      req,
      resourceId: updatedWorkOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.json({ success: true, workOrder: updatedWorkOrder });
  } catch (error) {
    console.error("Failed to assign work order:", error);
    res.status(500).json({ message: "Failed to assign work order" });
  }
};

export const completeWorkOrder = async (req, res) => {
  try {
    const workOrder = await loadWorkOrderForMutation(req, res);

    if (!workOrder) return;

    const oldValue =
      typeof workOrder.toObject === "function" ? workOrder.toObject() : workOrder;
    const updatedWorkOrder = await updateWorkOrder(
      workOrder,
      {
        actor: req.body.actor || req.user?.name || req.user?.email || "Operator",
        actualCost: req.body.actualCost,
        actualHours: req.body.actualHours,
        checklist: req.body.checklist,
        completedDate: req.body.completedDate || new Date().toISOString(),
        completionNotes: req.body.completionNotes,
        maintenanceChecklist: req.body.maintenanceChecklist,
        note: req.body.note,
        status: "COMPLETED",
      },
      getIo(req)
    );

    await createAuditLog({
      action: "WORK_ORDER_COMPLETED",
      newValue: updatedWorkOrder,
      oldValue,
      req,
      resourceId: updatedWorkOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.json({ success: true, workOrder: updatedWorkOrder });
  } catch (error) {
    console.error("Failed to complete work order:", error);
    res.status(500).json({ message: "Failed to complete work order" });
  }
};

export const printWorkOrder = async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();

    if (!ensureValidIdentifier(identifier, res)) {
      return;
    }

    const workOrder = await getWorkOrderByIdentifier(identifier).lean();

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    const serializedWorkOrder = serializeWorkOrder(workOrder);
    const checklist = serializedWorkOrder.checklist
      .map(
        (item) =>
          `<li>${item.completed ? "[x]" : "[ ]"} ${escapeHtml(item.label)}</li>`
      )
      .join("");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html>
<head>
  <title>${escapeHtml(serializedWorkOrder.workOrderId)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    h1 { margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    td, th { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    .badge { border: 1px solid #94a3b8; border-radius: 999px; display: inline-block; padding: 4px 10px; }
  </style>
</head>
<body>
  <h1>KAVACH Work Order ${escapeHtml(serializedWorkOrder.workOrderId)}</h1>
  <p>${escapeHtml(serializedWorkOrder.machineName)} (${escapeHtml(serializedWorkOrder.machineId)})</p>
  <p><span class="badge">${escapeHtml(serializedWorkOrder.priority)}</span> <span class="badge">${escapeHtml(serializedWorkOrder.status)}</span></p>
  <table>
    <tr><th>Assigned Engineer</th><td>${escapeHtml(serializedWorkOrder.assignedEngineer || "Unassigned")}</td></tr>
    <tr><th>Maintenance Type</th><td>${escapeHtml(serializedWorkOrder.maintenanceType)}</td></tr>
    <tr><th>Scheduled Date</th><td>${escapeHtml(serializedWorkOrder.scheduledDate || "Not scheduled")}</td></tr>
    <tr><th>Estimated Hours</th><td>${escapeHtml(serializedWorkOrder.estimatedHours)}</td></tr>
    <tr><th>Cost Estimate</th><td>${escapeHtml(serializedWorkOrder.costEstimate)}</td></tr>
    <tr><th>Approval</th><td>${escapeHtml(serializedWorkOrder.approvalStatus)}</td></tr>
  </table>
  <h2>Description</h2>
  <p>${escapeHtml(serializedWorkOrder.description)}</p>
  <h2>Checklist</h2>
  <ul>${checklist || "<li>No checklist items</li>"}</ul>
  <script>window.print()</script>
</body>
</html>`);
  } catch (error) {
    console.error("Failed to print work order:", error);
    res.status(500).json({ message: "Failed to print work order" });
  }
};

export const removeWorkOrder = async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();

    if (!mongoose.isValidObjectId(identifier) && !identifier.startsWith("WO-")) {
      return res.status(400).json({ message: "Invalid work order id" });
    }

    const workOrder = await getWorkOrderByIdentifier(identifier);

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    const deletedWorkOrder = await deleteWorkOrder(workOrder, getIo(req));

    await createAuditLog({
      action: "WORK_ORDER_DELETED",
      oldValue: workOrder,
      req,
      resourceId: deletedWorkOrder.workOrderId,
      resourceType: "workOrder",
    });

    res.json({
      success: true,
      deletedWorkOrder,
    });
  } catch (error) {
    console.error("Failed to delete work order:", error);
    res.status(500).json({ message: "Failed to delete work order" });
  }
};
