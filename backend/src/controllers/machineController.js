import mongoose from "mongoose";
import Machine from "../models/machine.js";
import { createAuditLog } from "../services/auditService.js";
import { normalizeRole } from "../security/rbac.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import {
  getPagination,
  setPaginationHeaders,
} from "../utils/pagination.js";
import { sendErrorResponse } from "../utils/httpErrorResponse.js";

const getMachineLookup = (id) => {
  const identifier = String(id || "").trim();

  const filters = [{ machineId: identifier }];

  if (mongoose.isValidObjectId(identifier)) {
    filters.push({ _id: identifier });
  }

  return {
    identifier,
    query: { $or: filters },
  };
};

const getPlantScope = (req) => {
  if (req.query.plantId) {
    return { plantId: String(req.query.plantId) };
  }

  if (
    normalizeRole(req.user?.role) !== "Super Admin" &&
    Array.isArray(req.user?.plantIds) &&
    req.user.plantIds.length > 0
  ) {
    return { plantId: { $in: req.user.plantIds } };
  }

  return {};
};

const buildMachineQuery = (req, baseQuery = {}) => {
  const query = buildTenantScopedQuery(req, {
    ...getPlantScope(req),
    ...baseQuery,
  });

  for (const field of ["status", "criticality", "department", "manufacturer"]) {
    if (req.query?.[field]) {
      query[field] = String(req.query[field]);
    }
  }

  if (req.query?.search) {
    const search = String(req.query.search).trim();
    query.$or = [
      { machineId: new RegExp(search, "i") },
      { name: new RegExp(search, "i") },
      { department: new RegExp(search, "i") },
      { serialNumber: new RegExp(search, "i") },
      { manufacturer: new RegExp(search, "i") },
    ];
  }

  return query;
};

// Get all machines
export const getMachines = async (req, res) => {
  try {
    const query = buildMachineQuery(req);
    const findQuery = Machine.find(query).sort({ machineId: 1 }).lean();

    if (req.query.limit || req.query.page || req.query.skip) {
      const pagination = getPagination({
        defaultLimit: 100,
        maxLimit: 500,
        query: req.query,
      });
      const [machines, total] = await Promise.all([
        findQuery.skip(pagination.skip).limit(pagination.limit),
        Machine.countDocuments(query),
      ]);

      setPaginationHeaders(res, {
        count: machines.length,
        limit: pagination.limit,
        page: pagination.page,
        total,
      });

      return res.status(200).json(machines);
    }

    const machines = await findQuery;
    setPaginationHeaders(res, {
      count: machines.length,
      limit: machines.length,
      page: 1,
      total: machines.length,
    });

    res.status(200).json(machines);
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Failed to fetch machines" });
  }
};

// Get machine by ID
export const getMachineById = async (req, res) => {
  try {
    const { identifier, query } = getMachineLookup(req.params.id);

    if (!identifier) {
      return res.status(400).json({
        message: "Machine ID is required",
      });
    }

    const machine = await Machine.findOne(buildMachineQuery(req, query)).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    res.status(200).json(machine);
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Failed to fetch machine" });
  }
};

export const lookupMachineByQr = async (req, res) => {
  try {
    const code = String(req.params.code || req.query.code || "").trim();

    if (!code) {
      return res.status(400).json({
        message: "QR or barcode value is required",
      });
    }

    const machine = await Machine.findOne(
      buildMachineQuery(req, {
        $or: [
          { machineId: code },
          { qrCode: code },
          { barcode: code },
          { serialNumber: code },
          { linkedDeviceId: code },
        ],
      })
    ).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    await createAuditLog({
      action: "MACHINE_QR_LOOKUP",
      metadata: { code },
      req,
      resourceId: machine.machineId,
      resourceType: "machine",
    });

    res.json({
      machine,
      success: true,
    });
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Failed to lookup machine" });
  }
};

// Create machine
export const buildMachineCreatePayload = (req) => ({
  machineId: req.body.machineId,
  name: req.body.name,
  department: req.body.department,
  tenantId: req.body.tenantId || req.user?.tenantId || req.tenantContext?.tenantId || "",
  organizationId: req.body.organizationId || req.user?.organizationId || "",
  plantId: req.body.plantId || req.tenantContext?.plantId || req.user?.activePlantId || "",
  departmentId: req.body.departmentId || "",
  productionLineId: req.body.productionLineId || "",
  machineGroupId: req.body.machineGroupId || "",
  status: req.body.status,

  health: 100,
  temperature: 25,
  vibration: 0.2,
  pressure: 1.0,
  power: 0,
  current: 0,
  voltage: 415,
  energyConsumed: 0,
  efficiency: 100,
  rpm: 1450,
  humidity: 45,
  downtime: 0,
  oee: 100,
  remainingUsefulLifeHours: 720,
  predictedFailureProbability: 2,

  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
    recommendation: "Machine operating normally.",
  },
});

export const createMachine = async (req, res) => {
  try {
    const machine = await Machine.create(buildMachineCreatePayload(req));

    await createAuditLog({
      action: "MACHINE_CREATED",
      newValue: machine,
      req,
      resourceId: machine.machineId,
      resourceType: "machine",
    });

    res.status(201).json(machine);
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Unable to create machine" });
  }
};

// Update machine
export const updateMachine = async (req, res) => {
  try {
    const { query } = getMachineLookup(req.params.id);

    const scopedQuery = buildMachineQuery(req, query);
    const oldMachine = await Machine.findOne(scopedQuery).lean();
    const machine = await Machine.findOneAndUpdate(
      scopedQuery,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    await createAuditLog({
      action: "MACHINE_UPDATED",
      newValue: machine,
      oldValue: oldMachine,
      req,
      resourceId: machine.machineId,
      resourceType: "machine",
    });

    res.json(machine);
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Unable to update machine" });
  }
};

// Delete machine
export const deleteMachine = async (req, res) => {
  try {
    const { query } = getMachineLookup(req.params.id);

    const machine = await Machine.findOneAndDelete(buildMachineQuery(req, query));

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    await createAuditLog({
      action: "MACHINE_DELETED",
      oldValue: machine,
      req,
      resourceId: machine.machineId,
      resourceType: "machine",
    });

    res.json({
      success: true,
      message: "Machine deleted successfully",
    });
  } catch (err) {
    console.error(err);
    sendErrorResponse(res, err, { fallbackMessage: "Unable to delete machine" });
  }
};
