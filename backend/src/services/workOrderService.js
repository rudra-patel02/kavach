import mongoose from "mongoose";

import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import WorkOrder, {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
} from "../models/workOrder.js";
import { createMachinePrediction } from "./predictionService.js";

const ACTIVE_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"];

const priorityOrder = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const severityToPriority = {
  Critical: "CRITICAL",
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
};

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const normalizePriority = (priority = "MEDIUM") => {
  const normalizedPriority = String(priority).toUpperCase();
  return WORK_ORDER_PRIORITIES.includes(normalizedPriority)
    ? normalizedPriority
    : "MEDIUM";
};

const normalizeStatus = (status = "OPEN") => {
  const normalizedStatus = String(status).toUpperCase();
  return WORK_ORDER_STATUSES.includes(normalizedStatus) ? normalizedStatus : "OPEN";
};

const normalizeSeverity = (severity = "Medium") => {
  const normalizedSeverity = String(severity).toLowerCase();
  const severityMap = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return severityMap[normalizedSeverity] || "Medium";
};

const normalizeMaintenanceType = (maintenanceType = "Predictive") => {
  const normalizedType = String(maintenanceType).trim().toLowerCase();
  const typeMap = {
    corrective: "Corrective",
    emergency: "Emergency",
    inspection: "Inspection",
    predictive: "Predictive",
    preventive: "Preventive",
  };

  return typeMap[normalizedType] || "Predictive";
};

const normalizeApprovalStatus = (approvalStatus = "Not Required") => {
  const normalizedStatus = String(approvalStatus).trim().toLowerCase();
  const statusMap = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    "not required": "Not Required",
    not_required: "Not Required",
  };

  return statusMap[normalizedStatus] || "Not Required";
};

const getDueDate = (priority) => {
  const date = new Date();
  const offsetHours =
    priority === "CRITICAL"
      ? 8
      : priority === "HIGH"
        ? 24
        : priority === "MEDIUM"
          ? 72
          : 168;

  date.setHours(date.getHours() + offsetHours);
  return date;
};

const estimateRepairCost = (prediction, priority) => {
  const baseCost =
    priority === "CRITICAL"
      ? 18000
      : priority === "HIGH"
        ? 11000
        : priority === "MEDIUM"
          ? 6500
          : 2500;

  return Math.round(
    baseCost +
      Number(prediction.failureProbability || 0) * 85 +
      Number(prediction.estimatedDowntimeHours || 0) * 450
  );
};

const createWorkOrderId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const workOrderId = `WO-${datePart}-${randomPart}`;
    const existingOrder = await WorkOrder.exists({ workOrderId });

    if (!existingOrder) {
      return workOrderId;
    }
  }

  return `WO-${Date.now()}`;
};

const buildNotificationSnapshot = (notification) => {
  if (!notification) {
    return null;
  }

  const value =
    notification && typeof notification.toObject === "function"
      ? notification.toObject()
      : notification;

  return {
    notificationId: String(value._id || value.id),
    severity: value.severity,
    title: value.title,
    message: value.message,
    createdAt: value.createdAt || new Date(),
  };
};

const buildHistoryEvent = ({ event, from, to, actor = "System", message }) => ({
  event,
  from,
  to,
  actor,
  message,
  at: new Date(),
});

const buildWorkOrderPayload = async ({
  machine,
  notification,
  overrides = {},
  trigger = "Predictive automation",
}) => {
  const prediction = createMachinePrediction(machine);
  const notificationSnapshot = buildNotificationSnapshot(notification);
  const severity = normalizeSeverity(
    overrides.severity || notification?.severity || prediction.riskLevel
  );
  const priority = normalizePriority(
    overrides.priority || severityToPriority[severity] || prediction.maintenancePriority
  );
  const dueDate = overrides.dueDate ? new Date(overrides.dueDate) : getDueDate(priority);
  const estimatedDowntimeHours =
    Number(overrides.estimatedDowntimeHours) ||
    Number(overrides.estimatedHours) ||
    Number(prediction.estimatedDowntimeHours) ||
    0;
  const estimatedRepairCost =
    Number(overrides.estimatedRepairCost) ||
    Number(overrides.costEstimate) ||
    estimateRepairCost(prediction, priority);
  const approvalStatus = normalizeApprovalStatus(
    overrides.approvalStatus ||
      overrides.approvalWorkflow?.status ||
      (priority === "CRITICAL" ? "Pending" : "Not Required")
  );

  return {
    workOrderId: await createWorkOrderId(),
    assetId: overrides.assetId || machine.assetId || "",
    organizationId: overrides.organizationId || machine.organizationId || "",
    plantId: overrides.plantId || machine.plantId || "",
    tenantId: overrides.tenantId || machine.tenantId || "",
    machineId: machine.machineId,
    machineName: machine.name,
    department: overrides.department || machine.department || "Production",
    priority,
    severity,
    status: normalizeStatus(overrides.status || "OPEN"),
    assignedEngineer: overrides.assignedEngineer || "",
    createdBy: overrides.createdBy || overrides.actor || "System",
    description:
      overrides.description ||
      notification?.message ||
      `${machine.name} requires maintenance based on predictive telemetry.`,
    maintenanceType: normalizeMaintenanceType(
      overrides.maintenanceType ||
        (priority === "CRITICAL" ? "Emergency" : "Predictive")
    ),
    probableCause: overrides.probableCause || prediction.probableCause,
    aiRecommendation:
      overrides.aiRecommendation ||
      machine.aiPrediction?.recommendation ||
      prediction.recommendation,
    estimatedDowntimeHours,
    estimatedHours: estimatedDowntimeHours,
    actualHours: Number(overrides.actualHours) || 0,
    estimatedRepairCost,
    costEstimate: estimatedRepairCost,
    actualCost: Number(overrides.actualCost) || 0,
    approvalWorkflow: overrides.approvalWorkflow || {
      requestedBy: overrides.actor || "System",
      status: approvalStatus,
    },
    approvalStatus,
    requiredParts:
      overrides.requiredParts ||
      [
        {
          estimatedCost: priority === "CRITICAL" ? 4500 : 1800,
          name:
            priority === "CRITICAL"
              ? "Critical maintenance kit"
              : "Preventive maintenance kit",
          partNumber: `${machine.machineId}-KIT`,
          quantity: 1,
          status: "Required",
        },
      ],
    maintenanceChecklist:
      overrides.maintenanceChecklist ||
      [
        { completed: false, label: "Validate lockout/tagout readiness" },
        { completed: false, label: "Capture pre-maintenance telemetry snapshot" },
        { completed: false, label: "Inspect root-cause fault area" },
        { completed: false, label: "Record post-maintenance test result" },
      ],
    dueDate,
    scheduledDate: overrides.scheduledDate
      ? new Date(overrides.scheduledDate)
      : dueDate,
    completedDate: overrides.completedDate
      ? new Date(overrides.completedDate)
      : undefined,
    notes: overrides.notes || [],
    attachments: overrides.attachments || [],
    history: [
      buildHistoryEvent({
        event: "CREATED",
        to: "OPEN",
        actor: overrides.actor || "System",
        message: `${trigger} created this work order.`,
      }),
    ],
    notificationHistory: notificationSnapshot ? [notificationSnapshot] : [],
  };
};

export const serializeWorkOrder = (workOrder) => {
  const value =
    workOrder && typeof workOrder.toObject === "function"
      ? workOrder.toObject()
      : workOrder;

  return {
    id: String(value._id),
    workOrderId: value.workOrderId,
    assetId: value.assetId || "",
    organizationId: value.organizationId || "",
    plantId: value.plantId || "",
    tenantId: value.tenantId || "",
    machineId: value.machineId,
    machineName: value.machineName,
    department: value.department,
    priority: value.priority,
    severity: value.severity,
    status: value.status,
    assignedEngineer: value.assignedEngineer,
    createdBy: value.createdBy || "System",
    description: value.description,
    maintenanceType: value.maintenanceType || "Predictive",
    probableCause: value.probableCause,
    aiRecommendation: value.aiRecommendation,
    estimatedDowntimeHours: value.estimatedDowntimeHours,
    estimatedHours: value.estimatedHours || value.estimatedDowntimeHours || 0,
    actualHours: value.actualHours || 0,
    estimatedRepairCost: value.estimatedRepairCost,
    costEstimate: value.costEstimate || value.estimatedRepairCost || 0,
    actualCost: value.actualCost || 0,
    approvalWorkflow: value.approvalWorkflow || null,
    approvalStatus:
      value.approvalStatus || value.approvalWorkflow?.status || "Not Required",
    requiredParts: value.requiredParts || [],
    maintenanceChecklist: value.maintenanceChecklist || [],
    checklist: value.maintenanceChecklist || [],
    completionNotes: value.completionNotes || "",
    dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : null,
    scheduledDate: value.scheduledDate
      ? new Date(value.scheduledDate).toISOString()
      : value.dueDate
        ? new Date(value.dueDate).toISOString()
        : null,
    completedAt: value.completedAt
      ? new Date(value.completedAt).toISOString()
      : null,
    completedDate: value.completedDate
      ? new Date(value.completedDate).toISOString()
      : value.completedAt
        ? new Date(value.completedAt).toISOString()
        : null,
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : null,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : null,
    notes: (value.notes || []).map((note) => ({
      id: String(note._id || note.id),
      text: note.text,
      author: note.author,
      createdAt: new Date(note.createdAt).toISOString(),
    })),
    attachments: (value.attachments || []).map((attachment) => ({
      id: String(attachment._id || attachment.id),
      name: attachment.name,
      url: attachment.url,
      type: attachment.type,
      uploadedAt: new Date(attachment.uploadedAt).toISOString(),
    })),
    history: (value.history || []).map((event) => ({
      event: event.event,
      from: event.from,
      to: event.to,
      actor: event.actor,
      message: event.message,
      at: new Date(event.at).toISOString(),
    })),
    notificationHistory: (value.notificationHistory || []).map(
      (notification) => ({
        notificationId: notification.notificationId,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        createdAt: new Date(notification.createdAt).toISOString(),
      })
    ),
  };
};

export const findActiveWorkOrderForMachine = (machineId) =>
  WorkOrder.findOne({
    machineId,
    status: { $in: ACTIVE_STATUSES },
  }).sort({ createdAt: -1 });

const appendNotificationSnapshot = async (workOrder, notification) => {
  const snapshot = buildNotificationSnapshot(notification);

  if (!snapshot) {
    return workOrder;
  }

  const alreadyLinked = workOrder.notificationHistory.some(
    (item) => item.notificationId === snapshot.notificationId
  );

  if (alreadyLinked) {
    return workOrder;
  }

  workOrder.notificationHistory.push(snapshot);
  workOrder.history.push(
    buildHistoryEvent({
      event: "NOTIFICATION_LINKED",
      actor: "System",
      message: snapshot.message,
    })
  );

  await workOrder.save();
  return workOrder;
};

export const shouldCreateWorkOrderForMachine = (machine) => {
  const prediction = createMachinePrediction(machine);
  const health = Number(machine.health);
  const aiMaintenancePriority = String(
    machine.aiPrediction?.maintenancePriority || ""
  ).toLowerCase();
  const triggers = [];

  if (
    aiMaintenancePriority === "immediate" ||
    prediction.maintenancePriority === "Immediate"
  ) {
    triggers.push("AI Maintenance Priority = Immediate");
  }

  if (prediction.failureProbability > 85) {
    triggers.push(
      `Failure probability ${round(prediction.failureProbability, 1)}% > 85%`
    );
  }

  if (Number.isFinite(health) && health < 30) {
    triggers.push(`Machine health ${round(health, 1)}% < 30%`);
  }

  return {
    shouldCreate: triggers.length > 0,
    prediction,
    triggers,
  };
};

export const createWorkOrderFromMachine = async (
  machine,
  { notification, io, overrides = {}, trigger } = {}
) => {
  const assessment = shouldCreateWorkOrderForMachine(machine);
  const shouldCreateFromNotification = notification?.severity === "Critical";

  if (!assessment.shouldCreate && !shouldCreateFromNotification) {
    return null;
  }

  const activeWorkOrder = await findActiveWorkOrderForMachine(machine.machineId);

  if (activeWorkOrder) {
    const updatedWorkOrder = await appendNotificationSnapshot(
      activeWorkOrder,
      notification
    );
    return serializeWorkOrder(updatedWorkOrder);
  }

  const payload = await buildWorkOrderPayload({
    machine,
    notification,
    overrides,
    trigger:
      trigger ||
      (notification
        ? "Critical notification automation"
        : assessment.triggers.join(", ")),
  });
  let workOrder;

  try {
    workOrder = await WorkOrder.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      const existingWorkOrder = await findActiveWorkOrderForMachine(
        machine.machineId
      );
      return existingWorkOrder ? serializeWorkOrder(existingWorkOrder) : null;
    }

    throw error;
  }

  const serializedWorkOrder = serializeWorkOrder(workOrder);

  if (io) {
    io.emit("workorder:new", serializedWorkOrder);
  }

  return serializedWorkOrder;
};

export const createWorkOrderFromCriticalNotification = async (
  notification,
  io
) => {
  if (!notification || notification.severity !== "Critical") {
    return null;
  }

  const machine = await Machine.findOne({ machineId: notification.machineId }).lean();

  if (!machine) {
    return null;
  }

  return createWorkOrderFromMachine(machine, {
    notification,
    io,
    trigger: "Critical notification automation",
  });
};

export const createWorkOrdersForMachines = async (machines, io) => {
  const workOrders = [];

  for (const machine of machines) {
    const workOrder = await createWorkOrderFromMachine(machine, { io });

    if (workOrder) {
      workOrders.push(workOrder);
    }
  }

  return workOrders;
};

export const syncActiveMachineWorkOrders = async (io) => {
  const machines = await Machine.find().sort({ machineId: 1 }).lean();
  return createWorkOrdersForMachines(machines, io);
};

export const createManualWorkOrder = async (payload, io) => {
  const machine = await Machine.findOne({ machineId: payload.machineId }).lean();

  if (!machine) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  const activeWorkOrder = await findActiveWorkOrderForMachine(machine.machineId);

  if (activeWorkOrder) {
    const error = new Error("An active work order already exists for this machine");
    error.statusCode = 409;
    throw error;
  }

  const workOrderPayload = await buildWorkOrderPayload({
    machine,
    overrides: {
      ...payload,
      actor: payload.actor || "Operator",
    },
    trigger: "Manual operator request",
  });
  let workOrder;

  try {
    workOrder = await WorkOrder.create(workOrderPayload);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error(
        "An active work order already exists for this machine"
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }

  const serializedWorkOrder = serializeWorkOrder(workOrder);

  if (io) {
    io.emit("workorder:new", serializedWorkOrder);
  }

  return serializedWorkOrder;
};

export const getWorkOrderByIdentifier = (identifier) =>
  WorkOrder.findOne({
    $or: [
      ...(mongoose.isValidObjectId(identifier) ? [{ _id: identifier }] : []),
      { workOrderId: identifier },
    ],
  });

const updateMachineMaintenanceHistory = async (workOrder) => {
  await Machine.updateOne(
    { machineId: workOrder.machineId },
    {
      $push: {
        maintenanceHistory: {
          $each: [
            {
              workOrderId: workOrder.workOrderId,
              status: workOrder.status,
              completedAt: workOrder.completedAt,
              summary: workOrder.description,
              engineer: workOrder.assignedEngineer,
              notes: workOrder.notes.at(-1)?.text || "",
            },
          ],
          $position: 0,
          $slice: 25,
        },
      },
    }
  );
};

export const updateWorkOrder = async (workOrder, payload, io) => {
  const previousStatus = workOrder.status;
  const previousEngineer = workOrder.assignedEngineer;

  if (payload.priority !== undefined) {
    workOrder.priority = normalizePriority(payload.priority);
  }

  if (payload.severity !== undefined) {
    workOrder.severity = normalizeSeverity(payload.severity);
  }

  if (payload.maintenanceType !== undefined) {
    workOrder.maintenanceType = normalizeMaintenanceType(payload.maintenanceType);
  }

  if (payload.status !== undefined) {
    workOrder.status = normalizeStatus(payload.status);
  }

  if (payload.assignedEngineer !== undefined) {
    workOrder.assignedEngineer = String(payload.assignedEngineer || "").trim();

    if (workOrder.assignedEngineer && workOrder.status === "OPEN") {
      workOrder.status = "ASSIGNED";
    }
  }

  for (const field of [
    "createdBy",
    "description",
    "probableCause",
    "aiRecommendation",
    "department",
  ]) {
    if (payload[field] !== undefined) {
      workOrder[field] = String(payload[field] || "");
    }
  }

  if (payload.estimatedDowntimeHours !== undefined) {
    workOrder.estimatedDowntimeHours = Number(payload.estimatedDowntimeHours) || 0;
    workOrder.estimatedHours = workOrder.estimatedDowntimeHours;
  }

  if (payload.estimatedHours !== undefined) {
    workOrder.estimatedHours = Number(payload.estimatedHours) || 0;
    workOrder.estimatedDowntimeHours = workOrder.estimatedHours;
  }

  if (payload.actualHours !== undefined) {
    workOrder.actualHours = Number(payload.actualHours) || 0;
  }

  if (payload.estimatedRepairCost !== undefined) {
    workOrder.estimatedRepairCost = Number(payload.estimatedRepairCost) || 0;
    workOrder.costEstimate = workOrder.estimatedRepairCost;
  }

  if (payload.costEstimate !== undefined) {
    workOrder.costEstimate = Number(payload.costEstimate) || 0;
    workOrder.estimatedRepairCost = workOrder.costEstimate;
  }

  if (payload.actualCost !== undefined) {
    workOrder.actualCost = Number(payload.actualCost) || 0;
  }

  if (payload.completionNotes !== undefined) {
    workOrder.completionNotes = String(payload.completionNotes || "");
  }

  if (Array.isArray(payload.requiredParts)) {
    workOrder.requiredParts = payload.requiredParts;
  }

  if (Array.isArray(payload.maintenanceChecklist)) {
    workOrder.maintenanceChecklist = payload.maintenanceChecklist;
  }

  if (Array.isArray(payload.checklist)) {
    workOrder.maintenanceChecklist = payload.checklist;
  }

  if (payload.approvalWorkflow) {
    workOrder.approvalWorkflow = {
      ...(workOrder.approvalWorkflow || {}),
      ...payload.approvalWorkflow,
    };

    if (payload.approvalWorkflow.status) {
      workOrder.approvalStatus = normalizeApprovalStatus(
        payload.approvalWorkflow.status
      );
    }
  }

  if (payload.approvalStatus !== undefined) {
    workOrder.approvalStatus = normalizeApprovalStatus(payload.approvalStatus);
    workOrder.approvalWorkflow = {
      ...(workOrder.approvalWorkflow || {}),
      status: workOrder.approvalStatus,
    };
  }

  if (payload.dueDate !== undefined) {
    workOrder.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    workOrder.scheduledDate = workOrder.dueDate;
  }

  if (payload.scheduledDate !== undefined) {
    workOrder.scheduledDate = payload.scheduledDate
      ? new Date(payload.scheduledDate)
      : null;
    workOrder.dueDate = workOrder.scheduledDate;
  }

  if (payload.completedDate !== undefined) {
    workOrder.completedDate = payload.completedDate
      ? new Date(payload.completedDate)
      : null;
    workOrder.completedAt = workOrder.completedDate;
  }

  if (payload.note) {
    workOrder.notes.push({
      text: String(payload.note),
      author: payload.author || "Operator",
    });
    workOrder.history.push(
      buildHistoryEvent({
        event: "NOTE_ADDED",
        actor: payload.author || "Operator",
        message: String(payload.note),
      })
    );
  }

  if (Array.isArray(payload.attachments)) {
    workOrder.attachments.push(...payload.attachments);
  }

  if (previousEngineer !== workOrder.assignedEngineer) {
    workOrder.history.push(
      buildHistoryEvent({
        event: "ENGINEER_ASSIGNED",
        from: previousEngineer,
        to: workOrder.assignedEngineer,
        actor: payload.actor || "Operator",
        message: workOrder.assignedEngineer
          ? `Assigned to ${workOrder.assignedEngineer}.`
          : "Engineer assignment cleared.",
      })
    );
  }

  if (previousStatus !== workOrder.status) {
    workOrder.history.push(
      buildHistoryEvent({
        event: "STATUS_CHANGED",
        from: previousStatus,
        to: workOrder.status,
        actor: payload.actor || "Operator",
        message: `Status changed from ${previousStatus} to ${workOrder.status}.`,
      })
    );
  }

  if (workOrder.status === "COMPLETED" && !workOrder.completedAt) {
    workOrder.completedAt = new Date();
    workOrder.completedDate = workOrder.completedAt;
    workOrder.history.push(
      buildHistoryEvent({
        event: "COMPLETED",
        to: "COMPLETED",
        actor: payload.actor || "Operator",
        message: "Work order completed and maintenance history updated.",
      })
    );
  } else if (workOrder.status !== "COMPLETED") {
    workOrder.completedAt = null;
    workOrder.completedDate = null;
  }

  await workOrder.save();

  if (workOrder.status === "COMPLETED" && previousStatus !== "COMPLETED") {
    await updateMachineMaintenanceHistory(workOrder);
  }

  const serializedWorkOrder = serializeWorkOrder(workOrder);

  if (io) {
    io.emit("workorder:updated", serializedWorkOrder);
  }

  return serializedWorkOrder;
};

export const deleteWorkOrder = async (workOrder, io) => {
  await workOrder.deleteOne();

  if (io) {
    io.emit("workorder:deleted", {
      id: String(workOrder._id),
      workOrderId: workOrder.workOrderId,
    });
  }

  return {
    id: String(workOrder._id),
    workOrderId: workOrder.workOrderId,
  };
};

export const getRecentNotificationsForMachine = async (machineId) =>
  Notification.find({ machineId }).sort({ createdAt: -1 }).limit(8).lean();
