import Asset, { ASSET_LIFECYCLE_STATES } from "../models/asset.js";
import Area from "../models/area.js";
import Engineer from "../models/engineer.js";
import Notification from "../models/notification.js";
import NotificationRule from "../models/notificationRule.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Region from "../models/region.js";
import ReportSchedule from "../models/reportSchedule.js";
import Tenant from "../models/tenant.js";
import WorkOrder from "../models/workOrder.js";
import { createAuditLog, listAuditLogs } from "../services/auditService.js";
import {
  buildEnterpriseDashboard,
  createArea,
  createAsset,
  createEngineer,
  createNotificationRule,
  createRegion,
  createReportSchedule,
  createTenant,
  listCollection,
  makeEnterpriseId,
  serialize,
  updateAssetLifecycle,
} from "../services/enterpriseOperationsService.js";

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

const requireBodyFields = (body, fields) => {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
};

export const getEnterpriseDashboard = async (req, res) => {
  try {
    const dashboard = await buildEnterpriseDashboard({
      query: req.query,
      user: req.user,
    });

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    handleError(res, error, "Failed to load enterprise dashboard");
  }
};

export const getFleetIntelligence = async (req, res) => {
  try {
    const dashboard = await buildEnterpriseDashboard({
      query: req.query,
      user: req.user,
    });

    res.json({
      success: true,
      fleet: dashboard.fleet,
    });
  } catch (error) {
    handleError(res, error, "Failed to load fleet intelligence");
  }
};

export const getCrossPlantAnalytics = async (req, res) => {
  try {
    const dashboard = await buildEnterpriseDashboard({
      query: req.query,
      user: req.user,
    });

    res.json({
      success: true,
      analytics: dashboard.crossPlantAnalytics,
      plantComparison: dashboard.plantComparison,
    });
  } catch (error) {
    handleError(res, error, "Failed to load cross-plant analytics");
  }
};

export const listTenants = async (req, res) => {
  try {
    const data = await listCollection(Tenant, {
      query: req.query,
      searchFields: ["name", "tenantId", "domain", "industry"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list tenants");
  }
};

export const postTenant = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name"]);
    const tenant = await createTenant(req.body);

    await createAuditLog({
      action: "TENANT_CREATED",
      newValue: tenant,
      req,
      resourceId: tenant.tenantId,
      resourceType: "tenant",
    });

    res.status(201).json({ success: true, tenant: serialize(tenant) });
  } catch (error) {
    handleError(res, error, "Failed to create tenant");
  }
};

export const listOrganizations = async (req, res) => {
  try {
    const data = await listCollection(Organization, {
      query: req.query,
      searchFields: ["name", "industry", "headquartersCountry"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list organizations");
  }
};

export const postOrganization = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name"]);
    const organization = await Organization.create({
      headquartersCountry: req.body.headquartersCountry,
      headquartersRegion: req.body.headquartersRegion,
      industry: req.body.industry,
      name: String(req.body.name || "").trim(),
      organizationCode: req.body.organizationCode || makeEnterpriseId("ORG", req.body.name),
      tenantId: req.body.tenantId || req.user?.tenantId || "",
      timezone: req.body.timezone,
    });

    await createAuditLog({
      action: "ORGANIZATION_CREATED",
      newValue: organization,
      req,
      resourceId: organization._id,
      resourceType: "organization",
    });

    res.status(201).json({ success: true, organization: serialize(organization) });
  } catch (error) {
    handleError(res, error, "Failed to create organization");
  }
};

export const listRegions = async (req, res) => {
  try {
    const data = await listCollection(Region, {
      query: req.query,
      searchFields: ["name", "country", "regionId"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list regions");
  }
};

export const postRegion = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name", "country", "organizationId"]);
    const region = await createRegion(req.body);

    await createAuditLog({
      action: "REGION_CREATED",
      newValue: region,
      req,
      resourceId: region.regionId,
      resourceType: "region",
    });

    res.status(201).json({ success: true, region: serialize(region) });
  } catch (error) {
    handleError(res, error, "Failed to create region");
  }
};

export const listPlants = async (req, res) => {
  try {
    const data = await listCollection(Plant, {
      query: req.query,
      searchFields: ["name", "plantId", "country", "location"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list plants");
  }
};

export const postPlant = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name", "organizationId"]);
    const plant = await Plant.create({
      ...req.body,
      name: String(req.body.name || "").trim(),
      plantId: req.body.plantId || makeEnterpriseId("PLANT", req.body.name),
      tenantId: req.body.tenantId || req.user?.tenantId || "",
    });

    await createAuditLog({
      action: "PLANT_CREATED",
      newValue: plant,
      req,
      resourceId: plant.plantId,
      resourceType: "plant",
    });

    res.status(201).json({ success: true, plant: serialize(plant) });
  } catch (error) {
    handleError(res, error, "Failed to create plant");
  }
};

export const listAreas = async (req, res) => {
  try {
    const data = await listCollection(Area, {
      query: req.query,
      searchFields: ["name", "areaId", "type"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list areas");
  }
};

export const postArea = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name", "plantId"]);
    const area = await createArea(req.body);

    await createAuditLog({
      action: "AREA_CREATED",
      newValue: area,
      req,
      resourceId: area.areaId,
      resourceType: "area",
    });

    res.status(201).json({ success: true, area: serialize(area) });
  } catch (error) {
    handleError(res, error, "Failed to create area");
  }
};

export const listAssets = async (req, res) => {
  try {
    const data = await listCollection(Asset, {
      query: req.query,
      searchFields: [
        "name",
        "assetId",
        "machineId",
        "serialNumber",
        "manufacturer",
        "model",
        "qrCode",
        "barcode",
      ],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list assets");
  }
};

export const postAsset = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name", "machineId", "plantId"]);
    const asset = await createAsset({
      ...req.body,
      actor: req.user?.email || req.user?.name || "Operator",
    });

    await createAuditLog({
      action: "ASSET_CREATED",
      newValue: asset,
      req,
      resourceId: asset.assetId,
      resourceType: "asset",
    });

    req.app.get("machineGateway")?.broadcastEnterpriseRefresh?.({
      reason: "asset_created",
      assetId: asset.assetId,
    });

    res.status(201).json({ success: true, asset: serialize(asset) });
  } catch (error) {
    handleError(res, error, "Failed to create asset");
  }
};

export const patchAssetLifecycle = async (req, res) => {
  try {
    const assetId = String(req.params.assetId || "").trim();
    const state = String(req.body.state || "").trim();

    if (!ASSET_LIFECYCLE_STATES.includes(state)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lifecycle state",
        allowedStates: ASSET_LIFECYCLE_STATES,
      });
    }

    const asset = await updateAssetLifecycle({
      actor: req.user?.email || "Operator",
      assetId,
      notes: req.body.notes,
      state,
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    await createAuditLog({
      action: "ASSET_LIFECYCLE_UPDATED",
      newValue: asset,
      req,
      resourceId: asset.assetId,
      resourceType: "asset",
    });

    req.app.get("machineGateway")?.broadcastEnterpriseRefresh?.({
      reason: "asset_lifecycle_updated",
      assetId: asset.assetId,
    });

    res.json({ success: true, asset: serialize(asset) });
  } catch (error) {
    handleError(res, error, "Failed to update asset lifecycle");
  }
};

export const listEngineers = async (req, res) => {
  try {
    const data = await listCollection(Engineer, {
      query: req.query,
      searchFields: ["name", "email", "department", "engineerId"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list engineers");
  }
};

export const postEngineer = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name"]);
    const engineer = await createEngineer(req.body);

    await createAuditLog({
      action: "ENGINEER_CREATED",
      newValue: engineer,
      req,
      resourceId: engineer.engineerId,
      resourceType: "engineer",
    });

    res.status(201).json({ success: true, engineer: serialize(engineer) });
  } catch (error) {
    handleError(res, error, "Failed to create engineer");
  }
};

export const autoAssignWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findOne({
      workOrderId: String(req.params.workOrderId || "").trim(),
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: "Work order not found" });
    }

    const engineers = await Engineer.find({
      availability: "Available",
      status: "Active",
      $or: [{ plantId: workOrder.plantId || "" }, { plantId: "" }],
    }).lean();
    const scored = engineers
      .map((engineer) => {
        const skillScore = engineer.skills.some((skill) =>
          String(workOrder.probableCause || workOrder.description || "")
            .toLowerCase()
            .includes(String(skill).toLowerCase())
        )
          ? 20
          : 0;
        const workloadScore = Math.max(0, 10 - (engineer.currentTasks?.length || 0) * 2);
        const performanceScore = Number(engineer.performanceMetrics?.firstTimeFixRate || 0) / 10;

        return {
          engineer,
          score: skillScore + workloadScore + performanceScore,
        };
      })
      .sort((a, b) => b.score - a.score);
    const selected = scored[0]?.engineer;

    if (!selected) {
      return res.status(409).json({
        success: false,
        message: "No available engineer found",
      });
    }

    workOrder.assignedEngineer = selected.name;
    if (workOrder.status === "OPEN") {
      workOrder.status = "ASSIGNED";
    }
    workOrder.history.push({
      actor: req.user?.email || "KAVACH Assignment Engine",
      event: "ENGINEER_AUTO_ASSIGNED",
      message: `Assigned to ${selected.name}.`,
      to: selected.name,
    });
    await workOrder.save();

    await Engineer.updateOne(
      { engineerId: selected.engineerId },
      {
        $addToSet: { currentTasks: workOrder.workOrderId },
        $set: { availability: "Busy" },
      }
    );

    req.app.get("machineGateway")?.broadcastWorkOrderUpdated?.(workOrder.toObject());

    res.json({
      success: true,
      engineer: serialize(selected),
      workOrder: serialize(workOrder),
    });
  } catch (error) {
    handleError(res, error, "Failed to auto-assign work order");
  }
};

export const listNotificationRules = async (req, res) => {
  try {
    const data = await listCollection(NotificationRule, {
      query: req.query,
      searchFields: ["name", "severity"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list notification rules");
  }
};

export const postNotificationRule = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name"]);
    const notificationRule = await createNotificationRule(req.body);

    await createAuditLog({
      action: "NOTIFICATION_RULE_CREATED",
      newValue: notificationRule,
      req,
      resourceId: notificationRule._id,
      resourceType: "notificationRule",
    });

    res.status(201).json({
      success: true,
      notificationRule: serialize(notificationRule),
    });
  } catch (error) {
    handleError(res, error, "Failed to create notification rule");
  }
};

export const getEnterpriseAlerts = async (req, res) => {
  try {
    const data = await listCollection(Notification, {
      query: req.query,
      searchFields: ["title", "message", "machineName", "owner"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list enterprise alerts");
  }
};

export const commentOnAlert = async (req, res) => {
  try {
    requireBodyFields(req.body, ["text"]);
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            author: req.user?.email || "Operator",
            text: String(req.body.text),
          },
        },
        $set: req.body.owner ? { owner: String(req.body.owner) } : {},
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, alert: serialize(notification) });
  } catch (error) {
    handleError(res, error, "Failed to comment on alert");
  }
};

export const listReportSchedules = async (req, res) => {
  try {
    const data = await listCollection(ReportSchedule, {
      query: req.query,
      searchFields: ["name", "reportType", "frequency"],
      user: req.user,
    });

    res.json({ success: true, ...data });
  } catch (error) {
    handleError(res, error, "Failed to list report schedules");
  }
};

export const postReportSchedule = async (req, res) => {
  try {
    requireBodyFields(req.body, ["name", "reportType"]);
    const reportSchedule = await createReportSchedule(req.body);

    await createAuditLog({
      action: "REPORT_SCHEDULE_CREATED",
      newValue: reportSchedule,
      req,
      resourceId: reportSchedule._id,
      resourceType: "reportSchedule",
    });

    res.status(201).json({
      success: true,
      reportSchedule: serialize(reportSchedule),
    });
  } catch (error) {
    handleError(res, error, "Failed to create report schedule");
  }
};

export const getEnterpriseAudit = async (req, res) => {
  try {
    const logs = await listAuditLogs(req.query);

    res.json({
      success: true,
      logs: logs.map(serialize),
    });
  } catch (error) {
    handleError(res, error, "Failed to load enterprise audit logs");
  }
};
