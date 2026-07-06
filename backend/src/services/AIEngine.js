import AIHistory from "../models/AIHistory.js";
import Anomaly from "../models/Anomaly.js";
import Forecast from "../models/Forecast.js";
import Machine from "../models/machine.js";
import MachineHealthSnapshot from "../models/MachineHealthSnapshot.js";
import MaintenancePlan from "../models/MaintenancePlan.js";
import Prediction from "../models/Prediction.js";
import RootCause from "../models/RootCause.js";
import SensorHistory from "../models/sensorHistory.js";
import {
  AI_ENGINE_VERSION,
  average,
  buildTelemetryVector,
  getSeverityWeight,
  normalizeHistoryBySensor,
  round,
} from "./AIConfig.js";
import { analyzeAnomalies } from "./AnomalyService.js";
import { forecastFailures } from "./ForecastService.js";
import { generateMaintenancePlan } from "./PlannerService.js";
import { generateRecommendations } from "./RecommendationService.js";
import { analyzeRootCauses } from "./RootCauseService.js";
import { estimateRUL } from "./RULService.js";

const normalizeMachine = (machine) =>
  machine && typeof machine.toObject === "function" ? machine.toObject() : machine;

const getMachineIdentity = (machine = {}) => ({
  machineId: machine.machineId,
  machineName: machine.name || machine.machineName || "",
  department: machine.department || "Production",
});

const toDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const loadSensorHistory = async (machineId, limit = 360) => {
  const rows = await SensorHistory.find({ machineId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return rows.reverse();
};

const getFailureProbability = (forecast) =>
  round(Math.max(0, Number(forecast?.peakProbability || 0)), 1);

const buildMachineSummary = ({
  machine,
  anomaly,
  rootCause,
  rul,
  forecast,
  maintenancePlan,
  recommendations,
  timestamp,
}) => ({
  generatedAt: timestamp,
  anomaly: {
    detected: Boolean(anomaly.anomaly),
    severity: anomaly.severity,
    confidence: anomaly.confidence,
    severityScore: anomaly.severityScore,
    reason: anomaly.reason,
  },
  healthPercent: rul.healthPercent,
  riskPercent: rul.riskPercent,
  confidencePercent: rul.confidencePercent,
  remainingUsefulLifeHours: rul.remainingHours,
  remainingUsefulLifeDays: rul.remainingDays,
  failureProbability: getFailureProbability(forecast),
  rootCauseSummary: rootCause.summary,
  topRootCauses: rootCause.causes,
  forecast: {
    confidence: forecast.confidence,
    peakProbability: forecast.peakProbability,
    horizons: forecast.horizons,
    probabilityChart: forecast.probabilityChart,
  },
  maintenancePlan,
  recommendations,
  machine: {
    machineId: machine.machineId,
    name: machine.name,
    department: machine.department || "Production",
    status: machine.status || "Unknown",
  },
});

export const buildMachineIntelligence = async (
  machineInput,
  {
    metrics = {},
    sensorHistory,
    timestamp = new Date(),
    operatingHours,
    load,
  } = {}
) => {
  const machine = normalizeMachine(machineInput);
  const analysisTimestamp = toDate(timestamp);
  const telemetry = buildTelemetryVector(machine, metrics);
  const historyRows =
    sensorHistory || (await loadSensorHistory(machine.machineId));
  const historyBySensor = Array.isArray(historyRows)
    ? normalizeHistoryBySensor(historyRows)
    : historyRows || {};
  const anomaly = analyzeAnomalies({
    telemetry,
    historyBySensor,
    timestamp: analysisTimestamp,
  });
  const rootCause = analyzeRootCauses({
    telemetry,
    anomaly,
    machine,
  });
  const rul = estimateRUL({
    machine,
    telemetry,
    anomaly,
    rootCause,
    operatingHours,
    load,
  });
  const forecast = forecastFailures({
    telemetry,
    anomaly,
    rootCause,
    rul,
  });
  const maintenancePlan = generateMaintenancePlan({
    machine,
    anomaly,
    rootCause,
    rul,
    forecast,
  });
  const recommendations = generateRecommendations({
    anomaly,
    rootCause,
    rul,
    forecast,
    planner: maintenancePlan,
  });
  const timestampIso = analysisTimestamp.toISOString();
  const summary = buildMachineSummary({
    machine,
    anomaly,
    rootCause,
    rul,
    forecast,
    maintenancePlan,
    recommendations,
    timestamp: analysisTimestamp,
  });

  return {
    aiEngineVersion: AI_ENGINE_VERSION,
    generatedAt: timestampIso,
    machine: {
      machineId: machine.machineId,
      name: machine.name,
      department: machine.department || "Production",
      status: machine.status || "Unknown",
    },
    telemetry,
    anomaly,
    rootCause,
    remainingUsefulLife: rul,
    forecast,
    maintenancePlan,
    recommendations,
    machineSummary: summary,
  };
};

const buildHistoryDocs = ({ identity, intelligence, timestamp }) => [
  {
    ...identity,
    eventType: "anomaly",
    severity: intelligence.anomaly.severity,
    summary: intelligence.anomaly.reason,
    payload: intelligence.anomaly,
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp,
  },
  {
    ...identity,
    eventType: "root_cause",
    severity: intelligence.anomaly.severity,
    summary: intelligence.rootCause.summary,
    payload: intelligence.rootCause,
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp,
  },
  {
    ...identity,
    eventType: "forecast",
    severity: intelligence.anomaly.severity,
    summary: `Peak failure probability ${intelligence.forecast.peakProbability}%`,
    payload: intelligence.forecast,
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp,
  },
  {
    ...identity,
    eventType: "maintenance_plan",
    severity: intelligence.anomaly.severity,
    summary: intelligence.maintenancePlan.summary,
    payload: intelligence.maintenancePlan,
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp,
  },
  {
    ...identity,
    eventType: "prediction",
    severity: intelligence.anomaly.severity,
    summary: `RUL ${intelligence.remainingUsefulLife.remainingHours} hours, risk ${intelligence.remainingUsefulLife.riskPercent}%`,
    payload: {
      remainingUsefulLife: intelligence.remainingUsefulLife,
      recommendations: intelligence.recommendations,
    },
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp,
  },
];

export const persistMachineIntelligence = async (
  machineInput,
  intelligence,
  { source = "unknown", timestamp = new Date() } = {}
) => {
  const machine = normalizeMachine(machineInput);
  const identity = getMachineIdentity(machine);
  const persistedTimestamp = toDate(timestamp);
  const common = {
    ...identity,
    aiEngineVersion: AI_ENGINE_VERSION,
    timestamp: persistedTimestamp,
  };
  const anomalyDoc = await Anomaly.create({
    ...common,
    ...intelligence.anomaly,
    source,
    telemetry: intelligence.telemetry,
  });
  const rootCauseDoc = await RootCause.create({
    ...common,
    ...intelligence.rootCause,
    anomalyId: anomalyDoc._id,
  });
  const forecastDoc = await Forecast.create({
    ...common,
    ...intelligence.forecast,
  });
  const maintenancePlanDoc = await MaintenancePlan.create({
    ...common,
    ...intelligence.maintenancePlan,
    estimatedCompletionTime: intelligence.maintenancePlan.estimatedCompletionTime
      ? new Date(intelligence.maintenancePlan.estimatedCompletionTime)
      : undefined,
  });
  const predictionDoc = await Prediction.create({
    ...common,
    healthPercent: intelligence.remainingUsefulLife.healthPercent,
    riskPercent: intelligence.remainingUsefulLife.riskPercent,
    confidencePercent: intelligence.remainingUsefulLife.confidencePercent,
    remainingUsefulLife: intelligence.remainingUsefulLife,
    forecast: intelligence.forecast,
    rootCauseSummary: intelligence.rootCause.summary,
    recommendations: intelligence.recommendations,
    anomalyId: anomalyDoc._id,
    rootCauseId: rootCauseDoc._id,
    forecastId: forecastDoc._id,
  });
  const snapshotDoc = await MachineHealthSnapshot.create({
    ...common,
    healthPercent: intelligence.remainingUsefulLife.healthPercent,
    riskPercent: intelligence.remainingUsefulLife.riskPercent,
    remainingUsefulLifeHours: intelligence.remainingUsefulLife.remainingHours,
    remainingUsefulLifeDays: intelligence.remainingUsefulLife.remainingDays,
    failureProbability: getFailureProbability(intelligence.forecast),
    anomaly: intelligence.anomaly.anomaly,
    anomalySeverity: intelligence.anomaly.severity,
    rootCauseSummary: intelligence.rootCause.summary,
    confidencePercent: intelligence.remainingUsefulLife.confidencePercent,
    telemetry: intelligence.telemetry,
    forecast: intelligence.forecast,
  });

  await AIHistory.insertMany(
    buildHistoryDocs({
      identity,
      intelligence,
      timestamp: persistedTimestamp,
    }),
    { ordered: false }
  );

  await Machine.updateOne(
    { machineId: machine.machineId },
    {
      $set: {
        aiIntelligence: intelligence.machineSummary,
        aiHealthPercent: intelligence.remainingUsefulLife.healthPercent,
        aiRiskPercent: intelligence.remainingUsefulLife.riskPercent,
        aiFailureProbability: getFailureProbability(intelligence.forecast),
        aiRemainingUsefulLifeHours:
          intelligence.remainingUsefulLife.remainingHours,
        aiRootCauseSummary: intelligence.rootCause.summary,
        aiAnomalySeverity: intelligence.anomaly.severity,
        aiConfidencePercent: intelligence.remainingUsefulLife.confidencePercent,
        aiLastAnalyzedAt: persistedTimestamp,
      },
    }
  );

  return {
    anomalyId: String(anomalyDoc._id),
    rootCauseId: String(rootCauseDoc._id),
    forecastId: String(forecastDoc._id),
    maintenancePlanId: String(maintenancePlanDoc._id),
    predictionId: String(predictionDoc._id),
    snapshotId: String(snapshotDoc._id),
  };
};

export const runMachineAI = async (
  machine,
  {
    metrics = {},
    source = "unknown",
    timestamp = new Date(),
    sensorHistory,
    persist = true,
  } = {}
) => {
  const intelligence = await buildMachineIntelligence(machine, {
    metrics,
    sensorHistory,
    timestamp,
  });

  if (persist) {
    intelligence.persistence = await persistMachineIntelligence(
      machine,
      intelligence,
      { source, timestamp }
    );
  }

  return intelligence;
};

export const broadcastMachineIntelligence = (gateway, intelligence) => {
  if (!gateway) {
    return;
  }

  const payload = {
    machineId: intelligence.machine.machineId,
    generatedAt: intelligence.generatedAt,
    intelligence,
  };

  if (gateway.broadcastAIIntelligence) {
    gateway.broadcastAIIntelligence(payload);
    return;
  }

  gateway.emit?.("ai:intelligence:update", payload);

  if (intelligence.anomaly.anomaly) {
    gateway.emit?.("ai:anomaly", payload);
  }
};

export const runRealtimeAI = async (
  machine,
  {
    metrics = {},
    source = "unknown",
    timestamp = new Date(),
    gateway,
    persist = true,
  } = {}
) => {
  const intelligence = await runMachineAI(machine, {
    metrics,
    source,
    timestamp,
    persist,
  });

  broadcastMachineIntelligence(gateway, intelligence);
  return intelligence;
};

const getSummaryFromMachine = (machine) => {
  if (machine.aiIntelligence) {
    return {
      ...machine.aiIntelligence,
      generatedAt: machine.aiIntelligence.generatedAt
        ? new Date(machine.aiIntelligence.generatedAt).toISOString()
        : null,
      machine: {
        machineId: machine.machineId,
        name: machine.name,
        department: machine.department || "Production",
        status: machine.status || "Unknown",
      },
    };
  }

  return {
    generatedAt: machine.updatedAt || new Date().toISOString(),
    machine: {
      machineId: machine.machineId,
      name: machine.name,
      department: machine.department || "Production",
      status: machine.status || "Unknown",
    },
    anomaly: {
      detected: false,
      severity: "Low",
      confidence: 0,
      severityScore: 0,
      reason: "AI intelligence has not run for this machine yet.",
    },
    healthPercent: Number(machine.health || 0),
    riskPercent: Number(machine.predictedFailureProbability || 0),
    confidencePercent: 0,
    remainingUsefulLifeHours: Number(machine.remainingUsefulLifeHours || 0),
    remainingUsefulLifeDays: round(Number(machine.remainingUsefulLifeHours || 0) / 24, 1),
    failureProbability: Number(machine.predictedFailureProbability || 0),
    rootCauseSummary: "No root-cause assessment available yet.",
    topRootCauses: [],
    forecast: {
      confidence: 0,
      peakProbability: Number(machine.predictedFailureProbability || 0),
      horizons: [],
      probabilityChart: [],
    },
    maintenancePlan: {},
    recommendations: [],
  };
};

export const buildAIOverview = async ({ limit = 100 } = {}) => {
  const machines = await Machine.find().sort({ machineId: 1 }).limit(limit).lean();
  const machineIntelligence = machines.map(getSummaryFromMachine);
  const totalMachines = machineIntelligence.length;
  const averageHealth = round(
    average(machineIntelligence.map((item) => Number(item.healthPercent || 0))),
    1
  );
  const averageRisk = round(
    average(machineIntelligence.map((item) => Number(item.riskPercent || 0))),
    1
  );
  const highRiskMachines = machineIntelligence.filter(
    (item) =>
      getSeverityWeight(item.anomaly?.severity) >= 3 ||
      Number(item.failureProbability || 0) >= 65
  );
  const riskDistribution = machineIntelligence.reduce(
    (acc, item) => {
      const severity = item.anomaly?.severity || "Low";
      acc[severity] += 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );
  const fleetHealth = {
    totalMachines,
    averageHealth,
    averageRisk,
    highRiskMachines: highRiskMachines.length,
    criticalMachines: riskDistribution.Critical,
    riskDistribution,
  };
  const recommendations = machineIntelligence
    .flatMap((item) =>
      (item.recommendations || []).map((recommendation) => ({
        machineId: item.machine.machineId,
        machineName: item.machine.name,
        ...recommendation,
      }))
    )
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    aiEngineVersion: AI_ENGINE_VERSION,
    summary: fleetHealth,
    fleetHealth,
    machines: machineIntelligence.sort(
      (a, b) =>
        Number(b.failureProbability || 0) - Number(a.failureProbability || 0)
    ),
    recommendations,
    executiveInsights: buildExecutiveInsights(machineIntelligence, recommendations),
  };
};

export const buildExecutiveInsights = (machineIntelligence, recommendations = []) => {
  const critical = machineIntelligence.filter(
    (item) => item.anomaly?.severity === "Critical"
  );
  const highFailure = machineIntelligence.filter(
    (item) => Number(item.failureProbability || 0) >= 70
  );
  const lowRul = machineIntelligence.filter(
    (item) => Number(item.remainingUsefulLifeHours || 0) <= 72
  );
  const insights = [];

  if (critical.length > 0) {
    insights.push({
      title: "Critical anomalies require action",
      value: critical.length,
      narrative: `${critical.length} machine${critical.length === 1 ? "" : "s"} show critical anomaly severity.`,
      confidence: round(average(critical.map((item) => item.anomaly.confidence || 0)), 1),
    });
  }

  if (highFailure.length > 0) {
    insights.push({
      title: "Failure probability elevated",
      value: highFailure.length,
      narrative: `${highFailure.length} machine${highFailure.length === 1 ? "" : "s"} exceed 70% forecasted failure probability.`,
      confidence: round(average(highFailure.map((item) => item.confidencePercent || 0)), 1),
    });
  }

  if (lowRul.length > 0) {
    insights.push({
      title: "RUL window narrowing",
      value: lowRul.length,
      narrative: `${lowRul.length} asset${lowRul.length === 1 ? "" : "s"} have 72 hours or less estimated useful life.`,
      confidence: round(average(lowRul.map((item) => item.confidencePercent || 0)), 1),
    });
  }

  if (recommendations.length > 0) {
    insights.push({
      title: "Top maintenance action",
      value: recommendations[0].recommendation,
      narrative: `${recommendations[0].machineName}: ${recommendations[0].rationale}`,
      confidence: recommendations[0].confidence,
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Fleet stable",
      value: "Normal",
      narrative: "No critical AI decision signal is active across the monitored fleet.",
      confidence: 82,
    });
  }

  return insights;
};

export const getMachineIntelligence = async (machineId) => {
  const machine = await Machine.findOne({ machineId }).lean();

  if (!machine) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  const [
    latestAnomaly,
    latestRootCause,
    latestForecast,
    latestPrediction,
    latestMaintenancePlan,
    snapshots,
  ] = await Promise.all([
    Anomaly.findOne({ machineId }).sort({ timestamp: -1 }).lean(),
    RootCause.findOne({ machineId }).sort({ timestamp: -1 }).lean(),
    Forecast.findOne({ machineId }).sort({ timestamp: -1 }).lean(),
    Prediction.findOne({ machineId }).sort({ timestamp: -1 }).lean(),
    MaintenancePlan.findOne({ machineId }).sort({ timestamp: -1 }).lean(),
    MachineHealthSnapshot.find({ machineId }).sort({ timestamp: -1 }).limit(60).lean(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    aiEngineVersion: AI_ENGINE_VERSION,
    current: getSummaryFromMachine(machine),
    latest: {
      anomaly: latestAnomaly,
      rootCause: latestRootCause,
      forecast: latestForecast,
      prediction: latestPrediction,
      maintenancePlan: latestMaintenancePlan,
    },
    trends: snapshots
      .slice()
      .reverse()
      .map((snapshot) => ({
        time: new Date(snapshot.timestamp).toISOString(),
        health: snapshot.healthPercent,
        risk: snapshot.riskPercent,
        failureProbability: snapshot.failureProbability,
        remainingUsefulLifeHours: snapshot.remainingUsefulLifeHours,
        anomalySeverity: snapshot.anomalySeverity,
      })),
  };
};

export const getAIHistory = async ({
  machineId,
  eventType,
  limit = 100,
  page = 1,
} = {}) => {
  const filters = {};

  if (machineId) filters.machineId = machineId;
  if (eventType) filters.eventType = eventType;

  const pageSize = Math.min(Math.max(Number(limit) || 100, 1), 250);
  const currentPage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    AIHistory.find(filters)
      .sort({ timestamp: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AIHistory.countDocuments(filters),
  ]);

  return {
    page: currentPage,
    limit: pageSize,
    total,
    items,
  };
};
