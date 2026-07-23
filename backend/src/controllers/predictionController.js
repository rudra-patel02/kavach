import Machine from "../models/machine.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import { createAuditLog } from "../services/auditService.js";
import {
  buildPredictiveMachineDetail,
  buildPredictiveOverview,
} from "../services/predictionService.js";
import { buildWhatIfSimulation } from "../services/smartFactoryService.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getPredictiveOverview = async (req, res) => {
  try {
    const machines = await Machine.find(buildTenantScopedQuery(req))
      .sort({ machineId: 1 })
      .lean();
    const overview = buildPredictiveOverview(machines);

    await createAuditLog({
      action: "PREDICTION_OVERVIEW_REQUESTED",
      metadata: { machineCount: machines.length },
      req,
      resourceType: "prediction",
    });

    res.json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error("Predictive overview failed:", error);
    res.status(500).json({
      message: "Failed to generate predictive maintenance overview",
    });
  }
};

export const getPredictiveMachine = async (req, res) => {
  try {
    const machineId = String(req.params.machineId || "").trim();

    if (!machineId) {
      return res.status(400).json({
        message: "Machine ID is required",
      });
    }

    const machine = await Machine.findOne(
      buildTenantScopedQuery(req, {
        $or: [
          { machineId },
          { name: new RegExp(`^${escapeRegex(machineId)}$`, "i") },
        ],
      })
    ).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    const detail = buildPredictiveMachineDetail(machine);

    await createAuditLog({
      action: "PREDICTION_MACHINE_REQUESTED",
      metadata: { machineName: machine.name },
      req,
      resourceId: machine.machineId,
      resourceType: "prediction",
    });

    res.json({
      success: true,
      detail,
    });
  } catch (error) {
    console.error("Predictive machine detail failed:", error);
    res.status(500).json({
      message: "Failed to generate machine prediction",
    });
  }
};

export const simulatePredictiveScenario = async (req, res) => {
  try {
    const machineId = String(req.body?.machineId || req.params.machineId || "").trim();

    if (!machineId) {
      return res.status(400).json({
        message: "machineId is required",
      });
    }

    const machine = await Machine.findOne(
      buildTenantScopedQuery(req, {
        $or: [
          { machineId },
          { name: new RegExp(`^${escapeRegex(machineId)}$`, "i") },
        ],
      })
    ).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    const simulation = buildWhatIfSimulation(machine, {
      name: req.body?.name,
      overrides: req.body?.overrides || req.body?.metrics || {},
    });

    await createAuditLog({
      action: "PREDICTIVE_SIMULATION_RUN",
      metadata: {
        overrides: simulation.scenario.overrides,
        riskDelta: simulation.impact.riskDelta,
      },
      req,
      resourceId: machine.machineId,
      resourceType: "prediction-simulation",
    });

    res.json({
      simulation,
      success: true,
    });
  } catch (error) {
    console.error("Predictive simulation failed:", error);
    res.status(500).json({
      message: "Failed to run predictive simulation",
    });
  }
};
