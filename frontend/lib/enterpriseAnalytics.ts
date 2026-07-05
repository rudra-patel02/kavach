import type { MachineData, MachineStatus } from "@/types/machine";
import type { NotificationItem, NotificationSeverity } from "@/types/notification";
import type { PredictiveMachine, PredictiveOverview } from "@/types/predictive";
import type { WorkOrder } from "@/types/workOrder";

export interface EnterpriseMachineProfile {
  machine: MachineData;
  prediction: PredictiveMachine | null;
  openWorkOrders: WorkOrder[];
  criticalAlerts: NotificationItem[];
  alerts: NotificationItem[];
  failureProbability: number;
  remainingUsefulLifeHours: number;
  riskScore: number;
  recommendedActions: string[];
}

export interface ExecutiveKpis {
  totalMachines: number;
  running: number;
  warning: number;
  critical: number;
  averageHealth: number;
  overallOee: number;
  todaysProduction: number;
  downtimeToday: number;
  totalEnergy: number;
  activeWorkOrders: number;
  criticalAlerts: number;
}

export interface AnalyticsPoint {
  time: string;
  health: number;
  energy: number;
  temperature: number;
  failureProbability: number;
  downtime: number;
  oee: number;
  maintenanceCost: number;
  production: number;
}

export interface EnhancedAlert {
  id: string;
  severity: NotificationSeverity;
  displaySeverity: "Critical" | "Warning" | "Information";
  timestamp: string;
  assignedEngineer: string;
  machine: string;
  machineId: string;
  department: string;
  category: string;
  acknowledged: boolean;
  escalationLevel: string;
  resolutionNotes: string;
  message: string;
}

const activeStatuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"];

const round = (value: number, digits = 1) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;

const average = (values: number[]) => {
  const numericValues = values.filter(Number.isFinite);

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
};

const getEnergy = (machine: MachineData) =>
  Number(machine.energyConsumed ?? machine.power ?? 0);

const getStatus = (machine: MachineData): MachineStatus => machine.status || "Offline";

const getAlertCategory = (type: string) =>
  type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getDisplaySeverity = (severity: NotificationSeverity) => {
  if (severity === "Critical") {
    return "Critical";
  }

  if (severity === "High" || severity === "Medium") {
    return "Warning";
  }

  return "Information";
};

const getEscalationLevel = (alert: NotificationItem, workOrder?: WorkOrder) => {
  if (alert.severity === "Critical" && workOrder?.status === "IN_PROGRESS") {
    return "Level 3 - Active response";
  }

  if (alert.severity === "Critical") {
    return "Level 2 - Supervisor review";
  }

  if (alert.severity === "High") {
    return "Level 1 - Maintenance queue";
  }

  return "Monitor";
};

const getRecommendedActions = (
  machine: MachineData,
  prediction: PredictiveMachine | null,
  openWorkOrders: WorkOrder[],
  criticalAlerts: NotificationItem[]
) => {
  const actions = new Set<string>();

  if (prediction?.recommendation) {
    actions.add(prediction.recommendation);
  }

  if (criticalAlerts.length > 0) {
    actions.add("Acknowledge critical alerts and validate live telemetry.");
  }

  if (openWorkOrders.length > 0) {
    actions.add("Review active work orders before scheduling new maintenance.");
  }

  if (Number(machine.health) < 30) {
    actions.add("Reduce load and prepare immediate inspection window.");
  }

  if (Number(machine.temperature) > 90) {
    actions.add("Inspect cooling, lubrication, and thermal load conditions.");
  }

  if (Number(machine.vibration) > 1.2) {
    actions.add("Run vibration analysis and check bearings and alignment.");
  }

  if (actions.size === 0) {
    actions.add("Continue normal monitoring and preventive maintenance.");
  }

  return [...actions].slice(0, 4);
};

export const buildMachineProfiles = (
  machines: MachineData[],
  overview: PredictiveOverview | null,
  notifications: NotificationItem[],
  workOrders: WorkOrder[]
) =>
  machines.map((machine) => {
    const prediction =
      overview?.predictions.find(
        (item) => item.machineId === machine.machineId
      ) || null;
    const alerts = notifications.filter(
      (notification) => notification.machineId === machine.machineId
    );
    const criticalAlerts = alerts.filter(
      (notification) => notification.severity === "Critical"
    );
    const openWorkOrders = workOrders.filter(
      (workOrder) =>
        workOrder.machineId === machine.machineId &&
        activeStatuses.includes(workOrder.status)
    );
    const failureProbability = prediction?.failureProbability || 0;
    const remainingUsefulLifeHours = prediction?.remainingUsefulLifeHours || 0;
    const riskScore = round(
      failureProbability * 0.62 +
        (100 - Number(machine.health || 0)) * 0.28 +
        criticalAlerts.length * 6 +
        openWorkOrders.length * 4,
      1
    );

    return {
      machine,
      prediction,
      openWorkOrders,
      criticalAlerts,
      alerts,
      failureProbability,
      remainingUsefulLifeHours,
      riskScore,
      recommendedActions: getRecommendedActions(
        machine,
        prediction,
        openWorkOrders,
        criticalAlerts
      ),
    };
  });

export const calculateExecutiveKpis = (
  machines: MachineData[],
  overview: PredictiveOverview | null,
  notifications: NotificationItem[],
  workOrders: WorkOrder[]
): ExecutiveKpis => {
  const running = machines.filter((machine) => getStatus(machine) === "Running").length;
  const warning = machines.filter((machine) => getStatus(machine) === "Warning").length;
  const critical = machines.filter((machine) => getStatus(machine) === "Critical").length;
  const averageHealth = round(
    overview?.summary.machineHealth ||
      average(machines.map((machine) => Number(machine.health || 0))),
    1
  );
  const totalEnergy = round(
    machines.reduce((total, machine) => total + getEnergy(machine), 0),
    1
  );
  const activeWorkOrders = workOrders.filter((workOrder) =>
    activeStatuses.includes(workOrder.status)
  ).length;
  const downtimeToday = round(
    workOrders
      .filter((workOrder) => activeStatuses.includes(workOrder.status))
      .reduce(
        (total, workOrder) => total + Number(workOrder.estimatedDowntimeHours || 0),
        0
      ),
    1
  );
  const overallOee = round(
    Math.max(
      0,
      Math.min(
        100,
        averageHealth * 0.46 +
          average(machines.map((machine) => Number(machine.efficiency || 0))) * 0.38 +
          (machines.length ? (running / machines.length) * 100 : 0) * 0.16
      )
    ),
    1
  );
  const todaysProduction = Math.round(
    machines.reduce(
      (total, machine) =>
        total + Number(machine.efficiency || 0) * 11 + Number(machine.power || 0) * 1.8,
      0
    )
  );

  return {
    totalMachines: machines.length,
    running,
    warning,
    critical,
    averageHealth,
    overallOee,
    todaysProduction,
    downtimeToday,
    totalEnergy,
    activeWorkOrders,
    criticalAlerts: notifications.filter(
      (notification) => notification.severity === "Critical" && !notification.read
    ).length,
  };
};

export const buildAnalyticsSeries = (
  machines: MachineData[],
  overview: PredictiveOverview | null,
  workOrders: WorkOrder[]
): AnalyticsPoint[] => {
  const labels = ["T-5h", "T-4h", "T-3h", "T-2h", "T-1h", "Now"];
  const healthTrend = overview?.trends.health || [];
  const energyTrend = overview?.trends.energy || [];
  const temperatureTrend = overview?.trends.temperature || [];
  const failureTrend = overview?.trends.failureProbability || [];
  const activeDowntime = workOrders
    .filter((workOrder) => activeStatuses.includes(workOrder.status))
    .reduce((total, workOrder) => total + Number(workOrder.estimatedDowntimeHours || 0), 0);
  const maintenanceCost = workOrders.reduce(
    (total, workOrder) => total + Number(workOrder.estimatedRepairCost || 0),
    0
  );
  const avgEfficiency = average(machines.map((machine) => Number(machine.efficiency || 0)));

  return labels.map((label, index) => {
    const drift = labels.length - index - 1;
    const health = round(healthTrend[index]?.value ?? average(machines.map((m) => Number(m.health || 0))) - drift * 0.6, 1);
    const energy = round(energyTrend[index]?.value ?? average(machines.map(getEnergy)) + index * 12, 1);
    const temperature = round(
      temperatureTrend[index]?.value ??
        average(machines.map((machine) => Number(machine.temperature || 0))) +
          index * 0.8,
      1
    );
    const failureProbability = round(
      failureTrend[index]?.value ??
        average(
          machines.map((machine) => Math.max(2, 100 - Number(machine.health || 0)))
        ) +
          index * 1.2,
      1
    );
    const downtime = round(Math.max(0, activeDowntime * (0.45 + index * 0.11)), 1);
    const oee = round(Math.max(0, Math.min(100, health * 0.55 + avgEfficiency * 0.45 - downtime * 0.3)), 1);
    const production = Math.round(oee * machines.length * 12 + index * 28);

    return {
      time: label,
      health,
      energy,
      temperature,
      failureProbability,
      downtime,
      oee,
      maintenanceCost: Math.round(maintenanceCost * (0.52 + index * 0.1)),
      production,
    };
  });
};

export const buildEnhancedAlerts = (
  notifications: NotificationItem[],
  machines: MachineData[],
  workOrders: WorkOrder[]
): EnhancedAlert[] =>
  notifications.map((notification) => {
    const machine = machines.find((item) => item.machineId === notification.machineId);
    const workOrder = workOrders.find(
      (item) =>
        item.machineId === notification.machineId &&
        activeStatuses.includes(item.status)
    );
    const latestNote = workOrder?.notes.at(-1)?.text;

    return {
      id: notification.id,
      severity: notification.severity,
      displaySeverity: getDisplaySeverity(notification.severity),
      timestamp: notification.createdAt,
      assignedEngineer: workOrder?.assignedEngineer || "Unassigned",
      machine: notification.machineName,
      machineId: notification.machineId,
      department: machine?.department || workOrder?.department || "Production",
      category: getAlertCategory(notification.type),
      acknowledged: notification.read,
      escalationLevel: getEscalationLevel(notification, workOrder),
      resolutionNotes: latestNote || "No resolution notes recorded.",
      message: notification.message,
    };
  });

export const generateAiInsights = (
  profiles: EnterpriseMachineProfile[],
  workOrders: WorkOrder[]
) => {
  const insights: string[] = [];

  for (const profile of profiles) {
    if (profile.failureProbability >= 85) {
      insights.push(
        `${profile.machine.name} has a ${round(profile.failureProbability, 1)}% probability of failure.`
      );
    }

    if (Number(profile.machine.vibration) >= 1.2) {
      insights.push(
        `${profile.machine.name} has experienced increasing vibration in the latest operating window.`
      );
    }

    if (Number(profile.machine.energyConsumed || profile.machine.power || 0) >= 650) {
      insights.push(
        `${profile.machine.name} energy consumption is elevated against its normal operating band.`
      );
    }

    if (profile.openWorkOrders.length > 0) {
      insights.push(
        `${profile.machine.name} has ${profile.openWorkOrders.length} active maintenance work order${profile.openWorkOrders.length === 1 ? "" : "s"}.`
      );
    }
  }

  const criticalOrders = workOrders.filter(
    (workOrder) =>
      workOrder.priority === "CRITICAL" && activeStatuses.includes(workOrder.status)
  );

  if (criticalOrders.length > 0) {
    insights.push(
      `${criticalOrders.length} critical work order${criticalOrders.length === 1 ? "" : "s"} require executive attention.`
    );
  }

  if (insights.length === 0) {
    insights.push("All monitored assets are operating within expected enterprise thresholds.");
  }

  return insights.slice(0, 8);
};
