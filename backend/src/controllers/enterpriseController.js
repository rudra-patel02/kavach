import mongoose from "mongoose";

import Asset, { ASSET_LIFECYCLE_STATES } from "../models/asset.js";
import Area from "../models/area.js";
import Engineer from "../models/engineer.js";
import FleetAnalytics from "../models/fleetAnalytics.js";
import Invoice from "../models/invoice.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import NotificationRule from "../models/notificationRule.js";
import OnboardingProgress from "../models/onboardingProgress.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Prediction from "../models/Prediction.js";
import Region from "../models/region.js";
import ReportSchedule from "../models/reportSchedule.js";
import Subscription from "../models/subscription.js";
import Tenant from "../models/tenant.js";
import User from "../models/user.js";
import UserInvitation from "../models/userInvitation.js";
import WorkOrder from "../models/workOrder.js";
import { createAuditLog, listAuditLogs } from "../services/auditService.js";
import { generateDemoData, resetDemoData } from "../services/demoService.js";
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
import {
  buildInvitationFilter,
  createUserInvitation,
  revokeUserInvitation,
  serializeInvitation,
} from "../services/invitationService.js";
import {
  getOrCreateOnboardingProgress,
  saveOnboardingProgress,
  serializeOnboardingProgress,
  validateOnboardingProgress,
} from "../services/onboardingService.js";
import { getPermissionsForRole, normalizeRole } from "../security/rbac.js";

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

const getScopedTenantFilter = (req) =>
  req.tenantContext?.tenantId ? { tenantId: req.tenantContext.tenantId } : {};

const getScopedOrganizationFilter = (req) => ({
  ...getScopedTenantFilter(req),
  ...(req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
    ? { organizationId: req.tenantContext.organizationId }
    : {}),
});

const getScopedPlantFilter = (req) => ({
  ...getScopedOrganizationFilter(req),
  ...(req.tenantContext?.plantId && !req.tenantContext?.isSuperAdmin
    ? { plantId: req.tenantContext.plantId }
    : {}),
});

const identityClause = (id, codeField) => {
  const value = String(id || "").trim();
  const clauses = [{ [codeField]: value }];

  if (mongoose.isValidObjectId(value)) {
    clauses.push({ _id: value });
  }

  return { $or: clauses };
};

const organizationQuery = (req, id) => {
  const clauses = [getScopedTenantFilter(req)];

  if (id) {
    clauses.push(identityClause(id, "organizationCode"));
  }

  if (req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin) {
    clauses.push(identityClause(req.tenantContext.organizationId, "organizationCode"));
  }

  return { $and: clauses.filter((clause) => Object.keys(clause).length > 0) };
};

const plantQuery = (req, id) => {
  const clauses = [getScopedOrganizationFilter(req)];

  if (id) {
    clauses.push(identityClause(id, "plantId"));
  }

  if (
    !req.tenantContext?.isSuperAdmin &&
    Array.isArray(req.tenantContext?.plantIds) &&
    req.tenantContext.plantIds.length > 0
  ) {
    clauses.push({ plantId: { $in: req.tenantContext.plantIds } });
  }

  return { $and: clauses.filter((clause) => Object.keys(clause).length > 0) };
};

const toSafeUser = (user) => {
  const value = user && typeof user.toObject === "function" ? user.toObject() : user;

  if (!value) {
    return null;
  }

  const { password, refreshToken, ...safeUser } = value;

  return {
    ...safeUser,
    _id: value._id ? String(value._id) : undefined,
    permissions:
      Array.isArray(value.permissions) && value.permissions.length > 0
        ? value.permissions
        : getPermissionsForRole(value.role),
  };
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

export const getGlobalAdminConsole = async (req, res) => {
  try {
    const tenantFilter = getScopedTenantFilter(req);
    const organizationFilter = req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
      ? organizationQuery(req, req.tenantContext.organizationId)
      : tenantFilter;
    const plantFilter = getScopedPlantFilter(req);
    const userFilter = {
      ...tenantFilter,
      ...(req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
        ? { organizationId: req.tenantContext.organizationId }
        : {}),
    };
    const [
      tenants,
      organizations,
      plants,
      users,
      machines,
      workOrders,
      notifications,
      reportSchedules,
      subscriptions,
      invoices,
      latestAnalytics,
      auditLogs,
    ] = await Promise.all([
      Tenant.countDocuments(tenantFilter),
      Organization.countDocuments(organizationFilter),
      Plant.countDocuments(plantFilter),
      User.countDocuments(userFilter),
      Machine.countDocuments(plantFilter),
      WorkOrder.countDocuments(plantFilter),
      Notification.countDocuments(plantFilter),
      ReportSchedule.countDocuments(plantFilter),
      Subscription.find(userFilter).lean(),
      Invoice.find(userFilter).sort({ createdAt: -1 }).limit(20).lean(),
      FleetAnalytics.find(plantFilter).sort({ generatedAt: -1 }).limit(10).lean(),
      listAuditLogs({
        limit: 15,
        organizationId:
          req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
            ? req.tenantContext.organizationId
            : req.query.organizationId,
        plantId: req.tenantContext?.plantId || req.query.plantId,
        tenantId: req.tenantContext?.tenantId || req.query.tenantId,
      }),
    ]);
    const roleAggregation = await User.aggregate([
      { $match: userFilter },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    let storageUsage = {
      collections: {
        invoices: invoices.length,
        latestAnalytics: latestAnalytics.length,
      },
      dataSizeMb: null,
      storageSizeMb: null,
    };

    try {
      const stats = await mongoose.connection.db.stats();
      storageUsage = {
        ...storageUsage,
        dataSizeMb: Number((Number(stats.dataSize || 0) / 1024 / 1024).toFixed(2)),
        storageSizeMb: Number((Number(stats.storageSize || 0) / 1024 / 1024).toFixed(2)),
      };
    } catch {
      // DB stats can be unavailable on restricted MongoDB users; counts remain useful.
    }

    res.json({
      success: true,
      console: {
        generatedAt: new Date().toISOString(),
        dashboard: {
          machines,
          notifications,
          organizations,
          plants,
          reportSchedules,
          tenants,
          users,
          workOrders,
        },
        roles: roleAggregation.map((role) => ({
          count: role.count,
          role: role._id || "Unassigned",
        })),
        licenses: subscriptions.map(serialize),
        invoices: invoices.map(serialize),
        systemHealth: {
          database: mongoose.connection.readyState === 1 ? "connected" : "degraded",
          liveSocketStatus: req.app.get("io")?.engine?.clientsCount || 0,
          uptimeSeconds: Math.round(process.uptime()),
        },
        storageUsage,
        analytics: latestAnalytics.map(serialize),
        auditLogs: auditLogs.map(serialize),
        adminNotifications: [
          notifications > 0
            ? `${notifications} active notification records are available for review.`
            : "No active admin notifications.",
          workOrders > 0
            ? `${workOrders} work order records are available across the scope.`
            : "No work order records in the selected scope.",
        ],
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to load global admin console");
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

export const getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne(
      organizationQuery(req, req.params.id)
    ).lean();

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.json({ success: true, organization: serialize(organization) });
  } catch (error) {
    handleError(res, error, "Failed to load organization");
  }
};

export const patchOrganization = async (req, res) => {
  try {
    const oldOrganization = await Organization.findOne(
      organizationQuery(req, req.params.id)
    ).lean();
    const organization = await Organization.findOneAndUpdate(
      organizationQuery(req, req.params.id),
      {
        $set: {
          ...(req.body.name !== undefined ? { name: String(req.body.name).trim() } : {}),
          ...(req.body.industry !== undefined ? { industry: req.body.industry } : {}),
          ...(req.body.headquartersCountry !== undefined
            ? { headquartersCountry: req.body.headquartersCountry }
            : {}),
          ...(req.body.headquartersRegion !== undefined
            ? { headquartersRegion: req.body.headquartersRegion }
            : {}),
          ...(req.body.status !== undefined ? { status: req.body.status } : {}),
          ...(req.body.timezone !== undefined ? { timezone: req.body.timezone } : {}),
        },
      },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    await createAuditLog({
      action: "ORGANIZATION_UPDATED",
      newValue: organization,
      oldValue: oldOrganization,
      req,
      resourceId: organization._id,
      resourceType: "organization",
    });

    res.json({ success: true, organization: serialize(organization) });
  } catch (error) {
    handleError(res, error, "Failed to update organization");
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const oldOrganization = await Organization.findOne(
      organizationQuery(req, req.params.id)
    ).lean();
    const organization = await Organization.findOneAndUpdate(
      organizationQuery(req, req.params.id),
      { $set: { status: "Inactive" } },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    await createAuditLog({
      action: "ORGANIZATION_DEACTIVATED",
      newValue: organization,
      oldValue: oldOrganization,
      req,
      resourceId: organization._id,
      resourceType: "organization",
      severity: "Warning",
    });

    res.json({
      success: true,
      organization: serialize(organization),
    });
  } catch (error) {
    handleError(res, error, "Failed to deactivate organization");
  }
};

export const patchOrganizationSettings = async (req, res) => {
  try {
    const organization = await Organization.findOneAndUpdate(
      organizationQuery(req, req.params.id),
      {
        $set: {
          settings:
            req.body.settings && typeof req.body.settings === "object"
              ? req.body.settings
              : req.body,
        },
      },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    await createAuditLog({
      action: "ORGANIZATION_SETTINGS_UPDATED",
      newValue: organization.settings,
      req,
      resourceId: organization._id,
      resourceType: "organizationSettings",
    });

    res.json({ settings: organization.settings || {}, success: true });
  } catch (error) {
    handleError(res, error, "Failed to update organization settings");
  }
};

export const patchOrganizationBranding = async (req, res) => {
  try {
    const organization = await Organization.findOneAndUpdate(
      organizationQuery(req, req.params.id),
      {
        $set: {
          branding: {
            accentColor: req.body.accentColor || req.body.branding?.accentColor || "#22c55e",
            logoUrl: req.body.logoUrl || req.body.branding?.logoUrl || "",
            primaryColor: req.body.primaryColor || req.body.branding?.primaryColor || "#0891b2",
            theme: req.body.theme || req.body.branding?.theme || "dark",
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    await createAuditLog({
      action: "ORGANIZATION_BRANDING_UPDATED",
      newValue: organization.branding,
      req,
      resourceId: organization._id,
      resourceType: "organizationBranding",
    });

    res.json({ branding: organization.branding || {}, success: true });
  } catch (error) {
    handleError(res, error, "Failed to update organization branding");
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
    const region = await createRegion({
      ...req.body,
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

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

export const getPlant = async (req, res) => {
  try {
    const plant = await Plant.findOne(plantQuery(req, req.params.id)).lean();

    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    res.json({ plant: serialize(plant), success: true });
  } catch (error) {
    handleError(res, error, "Failed to load plant");
  }
};

export const patchPlant = async (req, res) => {
  try {
    const oldPlant = await Plant.findOne(plantQuery(req, req.params.id)).lean();
    const allowedFields = [
      "address",
      "capacityUnitsPerDay",
      "country",
      "latitude",
      "location",
      "longitude",
      "name",
      "plantManager",
      "regionId",
      "settings",
      "status",
      "timezone",
    ];
    const update = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );
    const plant = await Plant.findOneAndUpdate(
      plantQuery(req, req.params.id),
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    await createAuditLog({
      action: "PLANT_UPDATED",
      newValue: plant,
      oldValue: oldPlant,
      req,
      resourceId: plant.plantId,
      resourceType: "plant",
    });

    res.json({ plant: serialize(plant), success: true });
  } catch (error) {
    handleError(res, error, "Failed to update plant");
  }
};

export const deletePlant = async (req, res) => {
  try {
    const oldPlant = await Plant.findOne(plantQuery(req, req.params.id)).lean();
    const plant = await Plant.findOneAndUpdate(
      plantQuery(req, req.params.id),
      { $set: { status: "Inactive" } },
      { new: true }
    );

    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    await createAuditLog({
      action: "PLANT_DEACTIVATED",
      newValue: plant,
      oldValue: oldPlant,
      req,
      resourceId: plant.plantId,
      resourceType: "plant",
      severity: "Warning",
    });

    res.json({ plant: serialize(plant), success: true });
  } catch (error) {
    handleError(res, error, "Failed to deactivate plant");
  }
};

export const listInvitations = async (req, res) => {
  try {
    const invitations = await UserInvitation.find(
      buildInvitationFilter({
        organizationId: req.query.organizationId || req.params.id,
        req,
        status: req.query.status,
      })
    )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({
      invitations: invitations.map(serializeInvitation),
      success: true,
    });
  } catch (error) {
    handleError(res, error, "Failed to list invitations");
  }
};

export const postInvitation = async (req, res) => {
  try {
    const invitation = await createUserInvitation({
      payload: {
        ...req.body,
        organizationId: req.body.organizationId || req.params.id,
      },
      req,
    });

    await createAuditLog({
      action: "USER_INVITED",
      newValue: { ...invitation, token: undefined },
      req,
      resourceId: invitation._id,
      resourceType: "userInvitation",
    });

    res.status(201).json({
      invitation,
      success: true,
    });
  } catch (error) {
    handleError(res, error, "Failed to create invitation");
  }
};

export const revokeInvitation = async (req, res) => {
  try {
    const invitation = await revokeUserInvitation({ id: req.params.invitationId, req });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found", success: false });
    }

    await createAuditLog({
      action: "USER_INVITATION_REVOKED",
      newValue: invitation,
      req,
      resourceId: invitation._id,
      resourceType: "userInvitation",
      severity: "Warning",
    });

    res.json({ invitation, success: true });
  } catch (error) {
    handleError(res, error, "Failed to revoke invitation");
  }
};

export const assignUserRole = async (req, res) => {
  try {
    const userFilter = {
      ...getScopedTenantFilter(req),
      ...(mongoose.isValidObjectId(req.params.userId)
        ? { _id: req.params.userId }
        : { email: String(req.params.userId || "").toLowerCase() }),
    };
    const user = await User.findOne(userFilter).select("+password +refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const oldValue = toSafeUser(user);
    const role = normalizeRole(req.body.role || user.role);

    user.role = role;
    user.permissions = Array.isArray(req.body.permissions)
      ? req.body.permissions
      : getPermissionsForRole(role);

    if (Array.isArray(req.body.plantIds)) {
      user.plantIds = req.body.plantIds.map(String);
      user.activePlantId = req.body.activePlantId || user.activePlantId || user.plantIds[0] || "";
    }

    if (req.body.organizationId !== undefined) {
      user.organizationId = String(req.body.organizationId || "");
    }

    user.refreshToken = "";
    await user.save();

    const safeUser = toSafeUser(user);

    await createAuditLog({
      action: "USER_ROLE_ASSIGNED",
      newValue: safeUser,
      oldValue,
      req,
      resourceId: user._id,
      resourceType: "user",
      severity: "Warning",
    });

    res.json({ success: true, user: safeUser });
  } catch (error) {
    handleError(res, error, "Failed to assign user role");
  }
};

export const getOnboardingProgress = async (req, res) => {
  try {
    const organizationId =
      req.params.organizationId || req.query.organizationId || req.tenantContext?.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required", success: false });
    }

    const progress = await getOrCreateOnboardingProgress({ organizationId, req });
    const validation = await validateOnboardingProgress({
      organizationId,
      tenantId: req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

    res.json({
      progress: serializeOnboardingProgress(progress),
      success: true,
      validation,
    });
  } catch (error) {
    handleError(res, error, "Failed to load onboarding progress");
  }
};

export const patchOnboardingProgress = async (req, res) => {
  try {
    const organizationId =
      req.params.organizationId || req.body.organizationId || req.tenantContext?.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required", success: false });
    }

    const progress = await saveOnboardingProgress({
      organizationId,
      payload: req.body,
      req,
    });

    await createAuditLog({
      action: "ONBOARDING_PROGRESS_SAVED",
      newValue: progress,
      req,
      resourceId: organizationId,
      resourceType: "onboarding",
    });

    res.json({ progress: serializeOnboardingProgress(progress), success: true });
  } catch (error) {
    handleError(res, error, "Failed to save onboarding progress");
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const organizationId =
      req.params.organizationId || req.body.organizationId || req.tenantContext?.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required", success: false });
    }

    const validation = await validateOnboardingProgress({
      organizationId,
      tenantId: req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

    if (validation.errors.length > 0) {
      return res.status(409).json({
        errors: validation.errors,
        message: "Onboarding validation failed",
        success: false,
      });
    }

    const progress = await OnboardingProgress.findOneAndUpdate(
      {
        organizationId,
        tenantId: req.tenantContext?.tenantId || req.user?.tenantId || "",
      },
      {
        completedAt: new Date(),
        completedSteps: [
          "organization",
          "plant",
          "machines",
          "csvImport",
          "team",
          "aiConfiguration",
          "dashboardReady",
        ],
        currentStep: "dashboardReady",
        lastAutosavedAt: new Date(),
        status: "Completed",
        validationErrors: [],
      },
      { new: true, setDefaultsOnInsert: true, upsert: true }
    );

    await Organization.findByIdAndUpdate(organizationId, {
      "onboarding.completedAt": new Date(),
      "onboarding.status": "Completed",
    });

    await createAuditLog({
      action: "ONBOARDING_COMPLETED",
      newValue: progress,
      req,
      resourceId: organizationId,
      resourceType: "onboarding",
    });

    res.json({
      progress: serializeOnboardingProgress(progress),
      success: true,
      validation,
    });
  } catch (error) {
    handleError(res, error, "Failed to complete onboarding");
  }
};

export const getDemoConfiguration = async (req, res) => {
  try {
    res.json({
      configuration: {
        tenantId: "TENANT-DEMO",
        resetEndpoint: "/api/enterprise/demo/reset",
        seedEndpoint: "/api/enterprise/demo/generate",
        includes: [
          "Demo Organizations",
          "Demo Plants",
          "Demo Machines",
          "Demo Sensor Data",
          "Demo AI Predictions",
          "Demo Alerts",
          "Demo Work Orders",
          "Demo Analytics",
        ],
      },
      success: true,
    });
  } catch (error) {
    handleError(res, error, "Failed to load demo configuration");
  }
};

export const generateEnterpriseDemo = async (req, res) => {
  try {
    const result = await generateDemoData();

    await createAuditLog({
      action: "DEMO_DATA_GENERATED",
      metadata: result.counts,
      req,
      resourceId: result.demo.tenantId,
      resourceType: "demo",
      severity: "Warning",
    });

    req.app.get("machineGateway")?.broadcastEnterpriseRefresh?.({
      reason: "demo_generated",
      tenantId: result.demo.tenantId,
    });

    res.status(201).json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, "Failed to generate demo data");
  }
};

export const resetEnterpriseDemo = async (req, res) => {
  try {
    const deleted = await resetDemoData();

    await createAuditLog({
      action: "DEMO_DATA_RESET",
      metadata: deleted,
      req,
      resourceId: "TENANT-DEMO",
      resourceType: "demo",
      severity: "Warning",
    });

    req.app.get("machineGateway")?.broadcastEnterpriseRefresh?.({
      reason: "demo_reset",
      tenantId: "TENANT-DEMO",
    });

    res.json({ deleted, success: true });
  } catch (error) {
    handleError(res, error, "Failed to reset demo data");
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
    const area = await createArea({
      ...req.body,
      organizationId:
        req.body.organizationId || req.tenantContext?.organizationId || req.user?.organizationId || "",
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

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
      organizationId:
        req.body.organizationId || req.tenantContext?.organizationId || req.user?.organizationId || "",
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
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
    const engineer = await createEngineer({
      ...req.body,
      organizationId:
        req.body.organizationId || req.tenantContext?.organizationId || req.user?.organizationId || "",
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

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
    const notificationRule = await createNotificationRule({
      ...req.body,
      organizationId:
        req.body.organizationId || req.tenantContext?.organizationId || req.user?.organizationId || "",
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

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
    const reportSchedule = await createReportSchedule({
      ...req.body,
      organizationId:
        req.body.organizationId || req.tenantContext?.organizationId || req.user?.organizationId || "",
      plantId: req.body.plantId || req.tenantContext?.plantId || "",
      tenantId: req.body.tenantId || req.tenantContext?.tenantId || req.user?.tenantId || "",
    });

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
    const logs = await listAuditLogs({
      ...req.query,
      organizationId:
        req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
          ? req.tenantContext.organizationId
          : req.query.organizationId,
      plantId: req.tenantContext?.plantId || req.query.plantId,
      tenantId: req.tenantContext?.tenantId || req.query.tenantId,
    });

    const items = logs.map(serialize);

    res.json({
      success: true,
      items,
      logs: items,
      pagination: {
        limit: items.length,
        page: 1,
        pages: 1,
        total: items.length,
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to load enterprise audit logs");
  }
};
