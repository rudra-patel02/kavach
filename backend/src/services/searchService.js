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
  organizations = [],
  plants = [],
  query,
  machines,
  notifications,
  predictions = [],
  reports = [],
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

  for (const organization of organizations) {
    if (
      regex.test(organization.name) ||
      regex.test(organization.organizationCode) ||
      regex.test(organization.industry) ||
      regex.test(organization.headquartersCountry)
    ) {
      results.push(
        toResult({
          id: `organization:${organization._id}`,
          type: "Organization",
          title: organization.name,
          subtitle: `${organization.industry || "Industrial Manufacturing"} - ${organization.status || "Active"}`,
          href: "/enterprise/organizations",
          score: regex.test(organization.name) ? 5 : 3,
          metadata: organization,
        })
      );
    }
  }

  for (const plant of plants) {
    if (
      regex.test(plant.name) ||
      regex.test(plant.plantId) ||
      regex.test(plant.country) ||
      regex.test(plant.location) ||
      regex.test(plant.plantManager)
    ) {
      results.push(
        toResult({
          id: `plant:${plant.plantId}`,
          type: "Plant",
          title: plant.name,
          subtitle: `${plant.country || ""} ${plant.location || ""} - ${plant.status || "Active"}`,
          href: "/enterprise/plants",
          score: regex.test(plant.plantId) ? 5 : 3,
          metadata: plant,
        })
      );
    }
  }

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

  for (const prediction of predictions) {
    if (
      regex.test(prediction.machineId) ||
      regex.test(prediction.machineName) ||
      regex.test(prediction.rootCauseSummary) ||
      regex.test(String(prediction.riskPercent))
    ) {
      results.push(
        toResult({
          id: `prediction-record:${prediction._id}`,
          type: "Prediction",
          title: `${prediction.machineName || prediction.machineId} AI prediction`,
          subtitle: `${prediction.riskPercent || 0}% risk, ${prediction.healthPercent || 0}% health`,
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
          type: notification.type === "maintenance" ? "Notification" : "Alert",
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
          type: "Work Order",
          title: workOrder.workOrderId,
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
          type: "User",
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

  for (const report of reports) {
    if (
      regex.test(report.name) ||
      regex.test(report.reportType) ||
      regex.test(report.frequency) ||
      regex.test(report.format)
    ) {
      results.push(
        toResult({
          id: `report:${report._id}`,
          type: "Report",
          title: report.name,
          subtitle: `${report.reportType} - ${report.frequency} - ${report.format}`,
          href: "/enterprise/reports",
          score: 3,
          metadata: report,
        })
      );
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
};
