import { buildPredictiveOverview } from "./predictionService.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toResult = ({ id, type, title, subtitle, href, score = 1, metadata = {} }) => ({
  id,
  type,
  title,
  subtitle,
  href,
  score,
  metadata,
});

export const buildGlobalSearchResults = ({
  query,
  machines,
  notifications,
  workOrders,
  users,
}) => {
  const search = String(query || "").trim();

  if (!search) {
    return [];
  }

  const regex = new RegExp(escapeRegex(search), "i");
  const predictiveOverview = buildPredictiveOverview(machines);
  const results = [];

  for (const machine of machines) {
    if (
      regex.test(machine.machineId) ||
      regex.test(machine.name) ||
      regex.test(machine.department) ||
      regex.test(machine.status)
    ) {
      results.push(
        toResult({
          id: `machine:${machine.machineId}`,
          type: "Machine",
          title: `${machine.name} (${machine.machineId})`,
          subtitle: `${machine.department} - ${machine.status} - ${machine.health}% health`,
          href: `/machines/${encodeURIComponent(machine.machineId)}`,
          score: regex.test(machine.machineId) ? 5 : 3,
          metadata: machine,
        })
      );
    }
  }

  for (const prediction of predictiveOverview.predictions) {
    if (
      regex.test(prediction.machineId) ||
      regex.test(prediction.name) ||
      regex.test(prediction.riskLevel) ||
      regex.test(prediction.maintenancePriority) ||
      regex.test(prediction.probableCause)
    ) {
      results.push(
        toResult({
          id: `prediction:${prediction.machineId}`,
          type: "Prediction",
          title: `${prediction.name} risk prediction`,
          subtitle: `${prediction.failureProbability}% failure probability, RUL ${prediction.remainingUsefulLifeHours}h`,
          href: `/predictive?machine=${encodeURIComponent(prediction.machineId)}`,
          score: 4,
          metadata: prediction,
        })
      );
    }
  }

  for (const notification of notifications) {
    if (
      regex.test(notification.machineId) ||
      regex.test(notification.machineName) ||
      regex.test(notification.title) ||
      regex.test(notification.message) ||
      regex.test(notification.severity)
    ) {
      results.push(
        toResult({
          id: `alert:${notification._id}`,
          type: "Alert",
          title: notification.title,
          subtitle: `${notification.machineName} - ${notification.severity}`,
          href: "/alerts",
          score: notification.severity === "Critical" ? 4 : 2,
          metadata: notification,
        })
      );
    }
  }

  for (const workOrder of workOrders) {
    if (
      regex.test(workOrder.workOrderId) ||
      regex.test(workOrder.machineId) ||
      regex.test(workOrder.machineName) ||
      regex.test(workOrder.department) ||
      regex.test(workOrder.assignedEngineer)
    ) {
      results.push(
        toResult({
          id: `workOrder:${workOrder._id}`,
          type: workOrder.assignedEngineer ? "Engineer" : "Work Order",
          title: workOrder.assignedEngineer || workOrder.workOrderId,
          subtitle: `${workOrder.machineName} - ${workOrder.status} - ${workOrder.priority}`,
          href: "/workorders",
          score: 3,
          metadata: workOrder,
        })
      );
    }
  }

  for (const user of users) {
    if (
      regex.test(user.name) ||
      regex.test(user.email) ||
      regex.test(user.role) ||
      regex.test(user.department)
    ) {
      results.push(
        toResult({
          id: `user:${user._id}`,
          type: "Engineer",
          title: user.name,
          subtitle: `${user.role} - ${user.department}`,
          href: "/users",
          score: 2,
          metadata: {
            id: user._id,
            name: user.name,
            role: user.role,
            department: user.department,
          },
        })
      );
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30);
};
