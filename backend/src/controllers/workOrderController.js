import mongoose from "mongoose";

import WorkOrder from "../models/workOrder.js";
import {
  createManualWorkOrder,
  deleteWorkOrder,
  getRecentNotificationsForMachine,
  getWorkOrderByIdentifier,
  serializeWorkOrder,
  updateWorkOrder,
} from "../services/workOrderService.js";

const getIo = (req) => req.app.get("io");
const ACTIVE_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"];

const buildQuery = (query) => {
  const filters = {};

  for (const field of ["status", "priority", "department", "assignedEngineer"]) {
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
    date: { createdAt: 1 },
    "-date": { createdAt: -1 },
    dueDate: { dueDate: 1 },
    "-dueDate": { dueDate: -1 },
  };

  return sortMap[sort] || { createdAt: -1 };
};

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
    const identifier = String(req.params.id || "").trim();

    if (!mongoose.isValidObjectId(identifier) && !identifier.startsWith("WO-")) {
      return res.status(400).json({ message: "Invalid work order id" });
    }

    const workOrder = await getWorkOrderByIdentifier(identifier);

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    const updatedWorkOrder = await updateWorkOrder(
      workOrder,
      req.body,
      getIo(req)
    );

    res.json({
      success: true,
      workOrder: updatedWorkOrder,
    });
  } catch (error) {
    console.error("Failed to update work order:", error);
    res.status(500).json({ message: "Failed to update work order" });
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

    res.json({
      success: true,
      deletedWorkOrder,
    });
  } catch (error) {
    console.error("Failed to delete work order:", error);
    res.status(500).json({ message: "Failed to delete work order" });
  }
};
