const ACTIVE_WORK_ORDER_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_PARTS"];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const average = (values) => {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

const getEnergy = (machine) =>
  Number.isFinite(Number(machine?.energyConsumed))
    ? Number(machine.energyConsumed)
    : Number(machine?.power || 0);

const getPredictionRiskFallback = (machine) => {
  const failureRisk = String(machine?.aiPrediction?.failureRisk || "").toLowerCase();

  if (failureRisk === "high") return 75;
  if (failureRisk === "medium") return 45;
  if (failureRisk === "low") return 12;
  return 0;
};

const getFailureProbability = (machine, prediction) => {
  const values = [
    prediction?.failureProbability,
    machine?.predictedFailureProbability,
    machine?.aiPrediction?.failureProbability,
    machine?.aiPrediction?.failureProbabilityPercent,
  ];
  const explicitValue = values.find((value) => Number.isFinite(Number(value)));

  return clamp(
    explicitValue === undefined ? getPredictionRiskFallback(machine) : Number(explicitValue),
    0,
    100
  );
};

const isToday = (dateLike) => {
  if (!dateLike) {
    return false;
  }

  const date = new Date(dateLike);

  if (!Number.isFinite(date.getTime())) {
    return false;
  }

  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const countStatus = (machines, status) =>
  machines.filter((machine) => normalizeStatus(machine.status) === status).length;

export const calculateExecutiveDashboardKpis = ({
  machines = [],
  notifications = [],
  workOrders = [],
  predictions = [],
} = {}) => {
  const safeMachines = Array.isArray(machines) ? machines.filter(Boolean) : [];
  const safeNotifications = Array.isArray(notifications)
    ? notifications.filter(Boolean)
    : [];
  const safeWorkOrders = Array.isArray(workOrders) ? workOrders.filter(Boolean) : [];
  const predictionByMachine = new Map(
    (Array.isArray(predictions) ? predictions : [])
      .filter((prediction) => prediction?.machineId)
      .map((prediction) => [prediction.machineId, prediction])
  );
  const totalMachines = safeMachines.length;
  const runningMachines = countStatus(safeMachines, "running");
  const idleMachines = countStatus(safeMachines, "idle");
  const maintenanceMachines = countStatus(safeMachines, "maintenance");
  const criticalMachines = countStatus(safeMachines, "critical");
  const warningMachines = countStatus(safeMachines, "warning");
  const offlineMachines = countStatus(safeMachines, "offline");
  const availability = totalMachines
    ? round((runningMachines / totalMachines) * 100, 1)
    : 0;
  const averageMachineHealth = round(
    average(safeMachines.map((machine) => machine.health)),
    1
  );
  const averageTemperature = round(
    average(safeMachines.map((machine) => machine.temperature)),
    1
  );
  const averageVibration = round(
    average(safeMachines.map((machine) => machine.vibration)),
    2
  );
  const averageEnergyConsumption = round(
    average(safeMachines.map((machine) => getEnergy(machine))),
    1
  );
  const totalEnergy = round(
    safeMachines.reduce((sum, machine) => sum + getEnergy(machine), 0),
    1
  );
  const utilization = totalMachines
    ? round(
        ((runningMachines + warningMachines * 0.7 + idleMachines * 0.2) /
          totalMachines) *
          100,
        1
      )
    : 0;
  const productionEfficiency = round(
    clamp(
      average(safeMachines.map((machine) => machine.efficiency)) || utilization,
      0,
      100
    ),
    1
  );
  const quality = round(clamp(averageMachineHealth, 0, 100), 1);
  const overallOeeScore = round(
    (availability * productionEfficiency * quality) / 10000,
    1
  );
  const activeWorkOrders = safeWorkOrders.filter((workOrder) =>
    ACTIVE_WORK_ORDER_STATUSES.includes(String(workOrder.status || "").toUpperCase())
  );
  const activeWorkOrderDowntime = activeWorkOrders.reduce(
    (sum, workOrder) => sum + Number(workOrder.estimatedDowntimeHours || 0),
    0
  );
  const machineDowntimeToday = safeMachines.reduce(
    (sum, machine) => sum + Number(machine.downtime || 0),
    0
  );
  const completedDowntimeToday = safeWorkOrders
    .filter((workOrder) => isToday(workOrder.completedAt || workOrder.updatedAt))
    .reduce(
      (sum, workOrder) => sum + Number(workOrder.estimatedDowntimeHours || 0),
      0
    );
  const estimatedDowntimeToday = round(
    activeWorkOrderDowntime + machineDowntimeToday + completedDowntimeToday,
    1
  );
  const activeAlertsCount = safeNotifications.filter(
    (notification) => notification.read !== true
  ).length;
  const criticalAlerts = safeNotifications.filter(
    (notification) => notification.severity === "Critical" && notification.read !== true
  ).length;
  const failureRisks = safeMachines.map((machine) =>
    getFailureProbability(machine, predictionByMachine.get(machine.machineId))
  );
  const averageAiFailureRisk = round(average(failureRisks), 1);
  const plantSafetyScore = round(
    clamp(
      100 -
        averageAiFailureRisk * 0.45 -
        (totalMachines ? (criticalMachines / totalMachines) * 24 : 0) -
        (totalMachines ? (activeAlertsCount / totalMachines) * 6 : activeAlertsCount),
      0,
      100
    ),
    1
  );

  return {
    availability,
    oee: overallOeeScore,
    health: averageMachineHealth,
    temperature: averageTemperature,
    vibration: averageVibration,
    energy: averageEnergyConsumption,
    risk: averageAiFailureRisk,
    alerts: activeAlertsCount,
    downtime: estimatedDowntimeToday,
    safetyScore: plantSafetyScore,
    efficiency: productionEfficiency,
    totalEnergy,
    criticalAlerts,
    activeWorkOrders: activeWorkOrders.length,
    machineSummary: {
      totalMachines,
      runningMachines,
      idleMachines,
      maintenanceMachines,
      criticalMachines,
      warningMachines,
      offlineMachines,
    },
    plantKpis: {
      availability,
      oee: overallOeeScore,
      health: averageMachineHealth,
      temperature: averageTemperature,
      vibration: averageVibration,
      energy: averageEnergyConsumption,
      risk: averageAiFailureRisk,
      alerts: activeAlertsCount,
      downtime: estimatedDowntimeToday,
      safetyScore: plantSafetyScore,
      efficiency: productionEfficiency,
    },
  };
};
