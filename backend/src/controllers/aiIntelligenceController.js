import Forecast from "../models/Forecast.js";
import Machine from "../models/machine.js";
import MaintenancePlan from "../models/MaintenancePlan.js";
import Prediction from "../models/Prediction.js";
import RootCause from "../models/RootCause.js";
import {
  buildAIOverview,
  getAIHistory,
  getMachineIntelligence,
  runMachineAI,
  broadcastMachineIntelligence,
} from "../services/AIEngine.js";
import { SENSOR_CONFIG } from "../services/AIConfig.js";

const ALLOWED_HISTORY_TYPES = new Set([
  "prediction",
  "anomaly",
  "root_cause",
  "forecast",
  "maintenance_plan",
  "recommendation",
  "health_snapshot",
]);

const parsePositiveInteger = (value, fallback, max) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.min(Math.floor(number), max);
};

const getMachineId = (req) => String(req.params.machineId || "").trim();

const assertMachineId = (machineId) => {
  if (!machineId) {
    const error = new Error("Machine ID is required");
    error.statusCode = 400;
    throw error;
  }
};

const validateTimestamp = (value) => {
  if (!value) {
    return new Date();
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    const error = new Error("timestamp must be a valid date");
    error.statusCode = 400;
    throw error;
  }

  return timestamp;
};

const validateMetrics = (metrics = {}) => {
  if (metrics === undefined || metrics === null) {
    return {};
  }

  if (typeof metrics !== "object" || Array.isArray(metrics)) {
    const error = new Error("metrics must be an object");
    error.statusCode = 400;
    throw error;
  }

  return Object.entries(metrics).reduce((acc, [key, value]) => {
    const config = SENSOR_CONFIG[key];

    if (!config) {
      const error = new Error(`Unsupported metric: ${key}`);
      error.statusCode = 400;
      throw error;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      const error = new Error(`${key} must be numeric`);
      error.statusCode = 400;
      throw error;
    }

    if (number < config.min || number > config.max) {
      const error = new Error(`${key} must be between ${config.min} and ${config.max}`);
      error.statusCode = 400;
      throw error;
    }

    acc[key] = number;
    return acc;
  }, {});
};

const validateEventType = (eventType) => {
  if (!eventType) {
    return undefined;
  }

  if (!ALLOWED_HISTORY_TYPES.has(eventType)) {
    const error = new Error("Invalid AI history eventType");
    error.statusCode = 400;
    throw error;
  }

  return eventType;
};

const handleError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode < 500 ? error.message : fallbackMessage,
  });
};

const getLatestByMachine = async (Model, machineId) => {
  assertMachineId(machineId);

  const item = await Model.findOne({ machineId }).sort({ timestamp: -1 }).lean();

  if (!item) {
    const error = new Error("AI record not found for machine");
    error.statusCode = 404;
    throw error;
  }

  return item;
};

export const getAiOverview = async (req, res) => {
  try {
    const overview = await buildAIOverview({
      limit: parsePositiveInteger(req.query.limit, 100, 500),
    });

    res.json({
      success: true,
      overview,
    });
  } catch (error) {
    handleError(res, error, "Failed to generate AI overview");
  }
};

export const getMachineAiIntelligence = async (req, res) => {
  try {
    const machineId = getMachineId(req);
    assertMachineId(machineId);
    const intelligence = await getMachineIntelligence(machineId);

    res.json({
      success: true,
      intelligence,
    });
  } catch (error) {
    handleError(res, error, "Failed to load machine intelligence");
  }
};

export const analyzeMachineNow = async (req, res) => {
  try {
    const machineId = getMachineId(req);
    assertMachineId(machineId);

    const machine = await Machine.findOne({ machineId }).lean();

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }

    const intelligence = await runMachineAI(machine, {
      metrics: validateMetrics(req.body?.metrics || {}),
      source: "manual",
      timestamp: validateTimestamp(req.body?.timestamp),
      persist: req.body?.persist !== false,
    });

    broadcastMachineIntelligence(req.app.get("machineGateway"), intelligence);

    res.status(201).json({
      success: true,
      intelligence,
    });
  } catch (error) {
    handleError(res, error, "Failed to analyze machine intelligence");
  }
};

export const getAiHistoryController = async (req, res) => {
  try {
    const history = await getAIHistory({
      machineId: req.query.machineId
        ? String(req.query.machineId).trim()
        : undefined,
      eventType: validateEventType(
        req.query.eventType ? String(req.query.eventType).trim() : undefined
      ),
      limit: parsePositiveInteger(req.query.limit, 100, 250),
      page: parsePositiveInteger(req.query.page, 1, 100000),
    });

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    handleError(res, error, "Failed to load AI history");
  }
};

export const getMachineForecast = async (req, res) => {
  try {
    const forecast = await getLatestByMachine(Forecast, getMachineId(req));

    res.json({
      success: true,
      forecast,
    });
  } catch (error) {
    handleError(res, error, "Failed to load failure forecast");
  }
};

export const getMachinePrediction = async (req, res) => {
  try {
    const prediction = await getLatestByMachine(Prediction, getMachineId(req));

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    handleError(res, error, "Failed to load AI prediction");
  }
};

export const getMachinePlanner = async (req, res) => {
  try {
    const maintenancePlan = await getLatestByMachine(
      MaintenancePlan,
      getMachineId(req)
    );

    res.json({
      success: true,
      maintenancePlan,
    });
  } catch (error) {
    handleError(res, error, "Failed to load maintenance planner");
  }
};

export const generateMachinePlanner = async (req, res) => {
  try {
    const machineId = getMachineId(req);
    assertMachineId(machineId);

    const machine = await Machine.findOne({ machineId }).lean();

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }

    const intelligence = await runMachineAI(machine, {
      metrics: validateMetrics(req.body?.metrics || {}),
      source: "manual",
      timestamp: validateTimestamp(req.body?.timestamp),
      persist: true,
    });

    broadcastMachineIntelligence(req.app.get("machineGateway"), intelligence);

    res.status(201).json({
      success: true,
      maintenancePlan: intelligence.maintenancePlan,
      intelligence,
    });
  } catch (error) {
    handleError(res, error, "Failed to generate maintenance planner");
  }
};

export const getMachineRootCause = async (req, res) => {
  try {
    const rootCause = await getLatestByMachine(RootCause, getMachineId(req));

    res.json({
      success: true,
      rootCause,
    });
  } catch (error) {
    handleError(res, error, "Failed to load root-cause analysis");
  }
};

export const getFleetHealth = async (req, res) => {
  try {
    const overview = await buildAIOverview({
      limit: parsePositiveInteger(req.query.limit, 100, 500),
    });

    res.json({
      success: true,
      fleetHealth: overview.fleetHealth,
      machines: overview.machines,
    });
  } catch (error) {
    handleError(res, error, "Failed to load fleet health");
  }
};

export const getExecutiveInsights = async (req, res) => {
  try {
    const overview = await buildAIOverview({
      limit: parsePositiveInteger(req.query.limit, 100, 500),
    });

    res.json({
      success: true,
      executiveInsights: overview.executiveInsights,
      recommendations: overview.recommendations,
    });
  } catch (error) {
    handleError(res, error, "Failed to load executive insights");
  }
};
