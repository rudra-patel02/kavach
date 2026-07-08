// Work-order domain helpers: pure lifecycle/scoping logic plus the tiny queries
// the controller composes. Kept free of req/res so the transition + scoping
// rules can be reasoned about (and unit-tested) in isolation.

import WorkOrder, {
  ACTIVE_WORK_ORDER_STATUSES,
  WORK_ORDER_STATUSES,
} from "../models/workOrder.js";

// The ordered lifecycle. A work order may only advance one step at a time and
// never backward: Open → Assigned → In Progress → Resolved.
export const STATUS_ORDER = WORK_ORDER_STATUSES;

export const statusRank = (status) => STATUS_ORDER.indexOf(status);

export const isValidTransition = (from, to) => {
  const fromRank = statusRank(from);
  const toRank = statusRank(to);
  return fromRank >= 0 && toRank === fromRank + 1;
};

// Every list/detail/mutation query is scoped to the caller. An Engineer only
// ever sees the work orders assigned to them; a Manager/Viewer oversees the
// whole (single) plant. This is the "scope every query to the caller" hard rule.
export const scopeForUser = (user = {}) => {
  if (user.role === "Engineer") {
    return { assigneeId: String(user.id ?? "") };
  }
  return {};
};

// Is there already an active (not-yet-Resolved) work order for this machine?
export const findActiveWorkOrderForMachine = (machineId) =>
  WorkOrder.findOne({ machineId, status: { $in: ACTIVE_WORK_ORDER_STATUSES } });

export const serializeWorkOrder = (workOrder) => {
  const value =
    workOrder && typeof workOrder.toObject === "function"
      ? workOrder.toObject()
      : workOrder;

  if (!value) {
    return null;
  }

  return { ...value, id: String(value._id || value.id) };
};
