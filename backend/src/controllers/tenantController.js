import Department from "../models/department.js";
import Machine from "../models/machine.js";
import MachineGroup from "../models/machineGroup.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import ProductionLine from "../models/productionLine.js";
import Tenant from "../models/tenant.js";
import User from "../models/user.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import { createAuditLog } from "../services/auditService.js";

const sanitizeId = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-");

const makeId = (prefix, value) =>
  `${prefix}-${sanitizeId(value).toUpperCase() || Date.now()}`;

const serialize = (doc) => ({
  ...doc,
  _id: String(doc._id),
  createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
});

export const getTenantOverview = async (req, res) => {
  try {
    const context = req.tenantContext || {};
    const tenantFilter = context.tenantId ? { tenantId: context.tenantId } : {};
    const organizationFilter = { ...tenantFilter };
    const plantFilter = buildTenantScopedQuery(req, {});
    const userFilter = {
      ...tenantFilter,
      ...(context.organizationId ? { organizationId: context.organizationId } : {}),
      ...(context.plantId
        ? { plantIds: context.plantId }
        : !context.isSuperAdmin && context.plantIds?.length
          ? { plantIds: { $in: context.plantIds } }
          : {}),
    };
    const [
      tenants,
      organizations,
      plants,
      departments,
      productionLines,
      machineGroups,
      users,
      machines,
    ] = await Promise.all([
      Tenant.find(tenantFilter).sort({ name: 1 }).lean(),
      Organization.find(organizationFilter).sort({ name: 1 }).lean(),
      Plant.find(plantFilter).sort({ name: 1 }).lean(),
      Department.find(plantFilter).sort({ name: 1 }).lean(),
      ProductionLine.find(plantFilter).sort({ name: 1 }).lean(),
      MachineGroup.find(plantFilter).sort({ name: 1 }).lean(),
      User.find(userFilter).select("-password -refreshToken").lean(),
      Machine.find(plantFilter).select("machineId plantId department productionLineId machineGroupId").lean(),
    ]);

    res.json({
      success: true,
      overview: {
        departments: departments.map(serialize),
        machineGroups: machineGroups.map(serialize),
        machines: machines.map(serialize),
        organizations: organizations.map(serialize),
        plants: plants.map(serialize),
        productionLines: productionLines.map(serialize),
        stats: {
          departments: departments.length,
          machineGroups: machineGroups.length,
          organizations: organizations.length,
          plants: plants.length,
          productionLines: productionLines.length,
          tenants: tenants.length,
          users: users.length,
        },
        tenants: tenants.map(serialize),
        users: users.map(serialize),
      },
    });
  } catch (error) {
    console.error("Failed to load tenant overview:", error);
    res.status(500).json({ message: "Failed to load tenant overview" });
  }
};

export const createTenant = async (req, res) => {
  try {
    const tenant = await Tenant.create({
      dataResidency: req.body.dataResidency,
      domain: req.body.domain,
      industry: req.body.industry,
      name: String(req.body.name || "").trim(),
      settings: req.body.settings || {},
      status: req.body.status,
      subscriptionTier: req.body.subscriptionTier,
      tenantId: String(req.body.tenantId || "").trim(),
    });

    await createAuditLog({
      action: "TENANT_CREATED",
      newValue: tenant,
      req,
      resourceId: tenant.tenantId,
      resourceType: "tenant",
    });

    res.status(201).json({ success: true, tenant: serialize(tenant.toObject()) });
  } catch (error) {
    console.error("Failed to create tenant:", error);
    res.status(500).json({ message: "Failed to create tenant" });
  }
};

export const updateTenantSettings = async (req, res) => {
  try {
    const tenantId = String(
      req.params.tenantId || req.body.tenantId || req.tenantContext?.tenantId || ""
    ).trim();

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    if (
      req.tenantContext?.tenantId &&
      req.tenantContext.tenantId !== tenantId &&
      !req.tenantContext?.isSuperAdmin
    ) {
      return res.status(403).json({ message: "Tenant access denied" });
    }

    const oldTenant = await Tenant.findOne({ tenantId }).lean();
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        settings:
          req.body.settings && typeof req.body.settings === "object"
            ? req.body.settings
            : {},
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    await createAuditLog({
      action: "TENANT_SETTINGS_UPDATED",
      newValue: tenant,
      oldValue: oldTenant,
      req,
      resourceId: tenant.tenantId,
      resourceType: "settings",
    });

    res.json({ settings: tenant.settings || {}, success: true });
  } catch (error) {
    console.error("Failed to update tenant settings:", error);
    res.status(500).json({ message: "Failed to update tenant settings" });
  }
};

export const createOrganization = async (req, res) => {
  try {
    const organization = await Organization.create({
      industry: req.body.industry,
      name: String(req.body.name || "").trim(),
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || "",
      timezone: req.body.timezone,
    });

    await createAuditLog({
      action: "ORGANIZATION_CREATED",
      newValue: organization,
      req,
      resourceId: organization._id,
      resourceType: "organization",
    });

    res.status(201).json({ organization: serialize(organization.toObject()), success: true });
  } catch (error) {
    console.error("Failed to create organization:", error);
    res.status(500).json({ message: "Failed to create organization" });
  }
};

export const createPlant = async (req, res) => {
  try {
    const plant = await Plant.create({
      location: req.body.location,
      name: String(req.body.name || "").trim(),
      organizationId: String(req.body.organizationId || "").trim(),
      plantId: req.body.plantId || makeId("PLANT", req.body.name),
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || "",
      timezone: req.body.timezone,
    });

    await createAuditLog({
      action: "PLANT_CREATED",
      newValue: plant,
      req,
      resourceId: plant.plantId,
      resourceType: "plant",
    });

    res.status(201).json({ plant: serialize(plant.toObject()), success: true });
  } catch (error) {
    console.error("Failed to create plant:", error);
    res.status(500).json({ message: "Failed to create plant" });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create({
      departmentId: req.body.departmentId || makeId("DEPT", req.body.name),
      manager: req.body.manager,
      name: String(req.body.name || "").trim(),
      organizationId: req.body.organizationId,
      plantId: String(req.body.plantId || "").trim(),
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || "",
    });

    res.status(201).json({
      department: serialize(department.toObject()),
      success: true,
    });
  } catch (error) {
    console.error("Failed to create department:", error);
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const createProductionLine = async (req, res) => {
  try {
    const productionLine = await ProductionLine.create({
      departmentId: req.body.departmentId,
      lineId: req.body.lineId || makeId("LINE", req.body.name),
      name: String(req.body.name || "").trim(),
      organizationId: req.body.organizationId,
      plantId: String(req.body.plantId || "").trim(),
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || "",
    });

    res.status(201).json({
      productionLine: serialize(productionLine.toObject()),
      success: true,
    });
  } catch (error) {
    console.error("Failed to create production line:", error);
    res.status(500).json({ message: "Failed to create production line" });
  }
};

export const createMachineGroup = async (req, res) => {
  try {
    const machineGroup = await MachineGroup.create({
      groupId: req.body.groupId || makeId("GROUP", req.body.name),
      machineIds: Array.isArray(req.body.machineIds) ? req.body.machineIds : [],
      name: String(req.body.name || "").trim(),
      organizationId: req.body.organizationId,
      plantId: String(req.body.plantId || "").trim(),
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || "",
    });

    res.status(201).json({
      machineGroup: serialize(machineGroup.toObject()),
      success: true,
    });
  } catch (error) {
    console.error("Failed to create machine group:", error);
    res.status(500).json({ message: "Failed to create machine group" });
  }
};

export const switchPlant = async (req, res) => {
  try {
    const plantId = String(req.body.plantId || "").trim();
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user.role !== "Super Admin" &&
      user.role !== "Admin" &&
      user.plantIds.length > 0 &&
      !user.plantIds.includes(plantId)
    ) {
      return res.status(403).json({ message: "Plant access denied" });
    }

    user.activePlantId = plantId;
    await user.save();

    res.json({
      activePlantId: user.activePlantId,
      success: true,
    });
  } catch (error) {
    console.error("Failed to switch plant:", error);
    res.status(500).json({ message: "Failed to switch plant" });
  }
};
