import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import WorkOrder from "../models/workOrder.js";
import { buildExecutiveDashboard } from "../services/executiveAnalyticsService.js";
import { buildPredictiveOverview } from "../services/predictionService.js";

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

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

const buildCsv = (machines, predictions) => {
  const predictionByMachine = new Map(
    predictions.map((prediction) => [prediction.machineId, prediction])
  );
  const header = [
    "machineId",
    "name",
    "department",
    "status",
    "health",
    "temperature",
    "vibration",
    "pressure",
    "energyConsumed",
    "failureProbability",
    "remainingUsefulLifeHours",
    "riskLevel",
    "maintenancePriority",
  ];
  const rows = machines.map((machine) => {
    const prediction = predictionByMachine.get(machine.machineId) || {};

    return [
      machine.machineId,
      machine.name,
      machine.department,
      machine.status,
      machine.health,
      machine.temperature,
      machine.vibration,
      machine.pressure,
      machine.energyConsumed || machine.power,
      prediction.failureProbability,
      prediction.remainingUsefulLifeHours,
      prediction.riskLevel,
      prediction.maintenancePriority,
    ].map(escapeCsv);
  });

  return [header, ...rows].map((row) => row.join(",")).join("\n");
};

const loadAnalyticsData = async () => {
  const [machines, notifications, workOrders] = await Promise.all([
    Machine.find().sort({ machineId: 1 }).lean(),
    Notification.find().sort({ createdAt: -1 }).limit(500).lean(),
    WorkOrder.find().sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return {
    machines,
    notifications,
    workOrders,
  };
};

const buildAdvancedAnalytics = ({ machines }, predictiveOverview, executiveDashboard) => {
  const kpis = executiveDashboard.kpis;
  const machineRanking = predictiveOverview.ranking.map((machine) => ({
    ...machine,
    oee: round(
      Number(machines.find((item) => item.machineId === machine.machineId)?.oee) ||
        kpis.oee
    ),
  }));
  const plantRanking = executiveDashboard.departmentPerformance.map(
    (department, index) => ({
      rank: index + 1,
      plant: department.department,
      oee: department.oee,
      availability: department.availability,
      performance: department.performance,
      quality: department.quality,
      energy: department.energy,
      downtime: department.downtime,
      riskLevel:
        department.critical > 0
          ? "Critical"
          : department.warnings > 0
            ? "Warning"
            : "Healthy",
    })
  );

  return {
    oee: kpis.oee,
    downtime: kpis.downtime,
    availability: kpis.availability,
    performance: kpis.performance,
    quality: kpis.quality,
    energy: kpis.totalEnergy,
    averageTemperature: round(average(machines.map((machine) => machine.temperature))),
    averageVibration: round(average(machines.map((machine) => machine.vibration)), 2),
    machineRanking,
    plantRanking,
    energyCost: kpis.energyCost,
    machineUtilization: kpis.machineUtilization,
    overallPlantHealth: predictiveOverview.summary.machineHealth,
    alertSummary: executiveDashboard.riskDistribution,
  };
};

export const getAnalyticsOverview = async (req, res) => {
  try {
    const data = await loadAnalyticsData();
    const predictiveOverview = buildPredictiveOverview(data.machines);
    const executiveDashboard = buildExecutiveDashboard(data);

    res.json({
      success: true,
      analytics: {
        generatedAt: new Date().toISOString(),
        kpis: buildAdvancedAnalytics(
          data,
          predictiveOverview,
          executiveDashboard
        ),
        heatmap: executiveDashboard.departmentPerformance,
        failureTrends: predictiveOverview.trends.failureProbability,
        departmentComparison: executiveDashboard.departmentPerformance,
        energyForecasting: executiveDashboard.trends.energy,
        maintenanceCostTrend: executiveDashboard.trends.downtime.map((point) => ({
          time: point.time,
          value: Math.round(point.value * 1250),
        })),
        predictionAccuracy: predictiveOverview.summary.aiConfidence,
        equipmentRanking: predictiveOverview.ranking,
        executiveDashboard,
      },
    });
  } catch (error) {
    console.error("Analytics overview failed:", error);
    res.status(500).json({
      message: "Failed to load analytics overview",
    });
  }
};

export const exportAnalyticsCsv = async (req, res) => {
  try {
    const data = await loadAnalyticsData();
    const predictiveOverview = buildPredictiveOverview(data.machines);
    const csv = buildCsv(data.machines, predictiveOverview.predictions);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kavach-analytics-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Analytics CSV export failed:", error);
    res.status(500).json({
      message: "Failed to export analytics CSV",
    });
  }
};
