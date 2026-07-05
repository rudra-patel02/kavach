import { buildPredictiveOverview } from "./predictionService.js";
import { calculateExecutiveDashboardKpis } from "./executiveDashboardService.js";

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
  const numericValues = values.filter((value) => Number.isFinite(Number(value)));

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((sum, value) => sum + Number(value), 0) / numericValues.length;
};

const getEnergy = (machine) =>
  Number.isFinite(Number(machine.energyConsumed))
    ? Number(machine.energyConsumed)
    : Number(machine.power || 0);

const getEnergyCostRate = () => Number(process.env.ENERGY_COST_PER_KWH || 0.12);
const getCarbonFactor = () => Number(process.env.CARBON_KG_PER_KWH || 0.42);

const countBy = (items, selector) =>
  items.reduce((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const buildDepartmentPerformance = (machines, predictions, workOrders) => {
  const predictionByMachine = new Map(
    predictions.map((prediction) => [prediction.machineId, prediction])
  );

  return Object.values(
    machines.reduce((acc, machine) => {
      const department = machine.department || "Production";
      const prediction = predictionByMachine.get(machine.machineId);

      acc[department] ||= {
        department,
        machines: 0,
        running: 0,
        warnings: 0,
        critical: 0,
        health: [],
        efficiency: [],
        energy: 0,
        failureProbability: [],
        downtime: 0,
      };

      acc[department].machines += 1;
      acc[department].running += machine.status === "Running" ? 1 : 0;
      acc[department].warnings += machine.status === "Warning" ? 1 : 0;
      acc[department].critical += machine.status === "Critical" ? 1 : 0;
      acc[department].health.push(Number(machine.health || 0));
      acc[department].efficiency.push(Number(machine.efficiency || 0));
      acc[department].energy += getEnergy(machine);
      acc[department].failureProbability.push(Number(prediction?.failureProbability || 0));

      return acc;
    }, {})
  ).map((department) => {
    const departmentWorkOrders = workOrders.filter(
      (workOrder) => workOrder.department === department.department
    );
    const activeDowntime = departmentWorkOrders
      .filter((workOrder) => ACTIVE_WORK_ORDER_STATUSES.includes(workOrder.status))
      .reduce((sum, workOrder) => sum + Number(workOrder.estimatedDowntimeHours || 0), 0);
    const availability = clamp(
      department.machines ? (department.running / department.machines) * 100 - activeDowntime : 0
    );
    const performance = clamp(average(department.efficiency));
    const quality = clamp(average(department.health));
    const oee = round((availability * performance * quality) / 10000, 1);

    return {
      department: department.department,
      machines: department.machines,
      running: department.running,
      warnings: department.warnings,
      critical: department.critical,
      availability: round(availability, 1),
      performance: round(performance, 1),
      quality: round(quality, 1),
      oee,
      energy: round(department.energy, 1),
      failureProbability: round(average(department.failureProbability), 1),
      activeWorkOrders: departmentWorkOrders.filter((workOrder) =>
        ACTIVE_WORK_ORDER_STATUSES.includes(workOrder.status)
      ).length,
      downtime: round(activeDowntime, 1),
    };
  });
};

const buildTrend = (base, direction = 1) => {
  const labels = ["T-5h", "T-4h", "T-3h", "T-2h", "T-1h", "Now"];

  return labels.map((time, index) => ({
    time,
    value: round(Math.max(0, base + direction * (index - labels.length + 1) * 1.8), 1),
  }));
};

export const buildExecutiveDashboard = ({
  machines,
  notifications,
  workOrders,
  aggregates = {},
}) => {
  const predictiveOverview = buildPredictiveOverview(machines);
  const enterpriseKpis = calculateExecutiveDashboardKpis({
    machines,
    notifications,
    workOrders,
    predictions: predictiveOverview.predictions,
  });
  const totalMachines = machines.length;
  const running = machines.filter((machine) => machine.status === "Running").length;
  const idle = machines.filter((machine) => machine.status === "Idle").length;
  const maintenance = machines.filter(
    (machine) => machine.status === "Maintenance"
  ).length;
  const warning = machines.filter((machine) => machine.status === "Warning").length;
  const critical = machines.filter((machine) => machine.status === "Critical").length;
  const offline = machines.filter((machine) => machine.status === "Offline").length;
  const activeWorkOrders = workOrders.filter((workOrder) =>
    ACTIVE_WORK_ORDER_STATUSES.includes(workOrder.status)
  );
  const completedWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "COMPLETED"
  );
  const downtime = enterpriseKpis.downtime;
  const availability = enterpriseKpis.availability;
  const performance = enterpriseKpis.efficiency;
  const quality = enterpriseKpis.health;
  const oee = enterpriseKpis.oee;
  const mtbf = round(720 / Math.max(1, critical + notifications.filter((item) => item.severity === "Critical").length), 1);
  const mttr = round(
    average(
      [...activeWorkOrders, ...completedWorkOrders].map((workOrder) =>
        Number(workOrder.estimatedDowntimeHours || 0)
      )
    ) || 1.2,
    1
  );
  const totalEnergy = enterpriseKpis.totalEnergy;
  const energyCost = round(totalEnergy * getEnergyCostRate(), 2);
  const carbonEmissionKg = round(totalEnergy * getCarbonFactor(), 1);
  const productionRate = Math.round(
    machines.reduce(
      (sum, machine) =>
        sum + Number(machine.efficiency || 0) * 11 + Number(machine.power || 0) * 1.8,
      0
    )
  );
  const machineUtilization = round(totalMachines ? ((running + warning) / totalMachines) * 100 : 0, 1);
  const departmentPerformance = buildDepartmentPerformance(
    machines,
    predictiveOverview.predictions,
    workOrders
  ).sort((a, b) => b.oee - a.oee);

  return {
    generatedAt: new Date().toISOString(),
    source: "mongodb_aggregation_and_live_telemetry",
    aggregates,
    kpis: {
      ...enterpriseKpis.plantKpis,
      oee,
      mtbf,
      mttr,
      downtime,
      availability,
      performance,
      quality,
      averageHealth: enterpriseKpis.health,
      averageMachineHealth: enterpriseKpis.health,
      averageTemperature: enterpriseKpis.temperature,
      averageVibration: enterpriseKpis.vibration,
      averageEnergyConsumption: enterpriseKpis.energy,
      productionEfficiency: enterpriseKpis.efficiency,
      overallOeeScore: enterpriseKpis.oee,
      estimatedDowntimeToday: enterpriseKpis.downtime,
      activeAlertsCount: enterpriseKpis.alerts,
      averageAiFailureRisk: enterpriseKpis.risk,
      plantSafetyScore: enterpriseKpis.safetyScore,
      energyCost,
      carbonEmissionKg,
      productionRate,
      machineUtilization,
      totalEnergy,
      totalMachines,
      running,
      idle,
      maintenance,
      warning,
      critical,
      offline,
      activeWorkOrders: activeWorkOrders.length,
      criticalAlerts: enterpriseKpis.criticalAlerts,
      runningMachines: enterpriseKpis.machineSummary.runningMachines,
      idleMachines: enterpriseKpis.machineSummary.idleMachines,
      maintenanceMachines: enterpriseKpis.machineSummary.maintenanceMachines,
      criticalMachines: enterpriseKpis.machineSummary.criticalMachines,
    },
    plantKpis: enterpriseKpis.plantKpis,
    machineSummary: enterpriseKpis.machineSummary,
    statusDistribution: countBy(machines, (machine) => machine.status || "Unknown"),
    riskDistribution: predictiveOverview.summary.riskDistribution,
    departmentPerformance,
    trends: {
      oee: buildTrend(oee, 1),
      downtime: buildTrend(downtime, -1),
      energy: buildTrend(totalEnergy / Math.max(1, totalMachines), 1),
      failureProbability: predictiveOverview.trends.failureProbability,
      production: buildTrend(productionRate, 1),
    },
    topRiskMachines: predictiveOverview.predictions.slice(0, 5),
    recommendations: predictiveOverview.recommendations,
  };
};
