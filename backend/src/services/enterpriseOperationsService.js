import Area from "../models/area.js";
import Asset from "../models/asset.js";
import Engineer from "../models/engineer.js";
import FleetAnalytics from "../models/fleetAnalytics.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import NotificationRule from "../models/notificationRule.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Region from "../models/region.js";
import ReportSchedule from "../models/reportSchedule.js";
import Tenant from "../models/tenant.js";
import WorkOrder from "../models/workOrder.js";
import { buildAIOverview } from "./AIEngine.js";

const ACTIVE_WORK_ORDER_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_PARTS",
];

export const ENTERPRISE_ROLES = [
  "Super Admin",
  "Organization Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
  "Admin",
  "Plant Admin",
];

const round = (value, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : 0;
};

const average = (values) => {
  const numericValues = values.map(Number).filter(Number.isFinite);

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
};

const sum = (values) =>
  values.map(Number).filter(Number.isFinite).reduce((total, value) => total + value, 0);

const getEnergy = (machine) =>
  Number(machine.energyConsumed ?? machine.energy ?? machine.power ?? 0);

const getFailureProbability = (machine) =>
  Number(
    machine.aiFailureProbability ??
      machine.predictedFailureProbability ??
      machine.aiIntelligence?.failureProbability ??
      0
  );

const getHealth = (machine) =>
  Number(machine.aiHealthPercent ?? machine.health ?? machine.aiIntelligence?.healthPercent ?? 0);

const getRul = (machine) =>
  Number(
    machine.aiRemainingUsefulLifeHours ??
      machine.remainingUsefulLifeHours ??
      machine.aiIntelligence?.remainingUsefulLifeHours ??
      0
  );

const sanitizeId = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-");

export const makeEnterpriseId = (prefix, value) =>
  `${prefix}-${sanitizeId(value).toUpperCase() || Date.now()}`;

const serialize = (doc) => {
  const value = doc && typeof doc.toObject === "function" ? doc.toObject() : doc;

  if (!value) {
    return value;
  }

  return {
    ...value,
    _id: value._id ? String(value._id) : undefined,
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : null,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : null,
  };
};

export const getEnterpriseScope = (user = {}, query = {}) => {
  const filters = {};

  if (query.tenantId) {
    filters.tenantId = String(query.tenantId);
  } else if (user.tenantId) {
    filters.tenantId = String(user.tenantId);
  }

  if (query.organizationId) {
    filters.organizationId = String(query.organizationId);
  } else if (user.organizationId && !["Super Admin", "Admin"].includes(user.role)) {
    filters.organizationId = String(user.organizationId);
  }

  if (query.plantId) {
    filters.plantId = String(query.plantId);
  } else if (
    !["Super Admin", "Admin", "Organization Admin", "Plant Admin"].includes(user.role) &&
    Array.isArray(user.plantIds) &&
    user.plantIds.length > 0
  ) {
    filters.plantId = { $in: user.plantIds };
  }

  return filters;
};

const buildPagination = ({ page = 1, limit = 50 } = {}) => {
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 250);
  const currentPage = Math.max(Number(page) || 1, 1);

  return {
    limit: pageSize,
    page: currentPage,
    skip: (currentPage - 1) * pageSize,
  };
};

const buildSort = (sort = "-createdAt") => {
  const direction = String(sort).startsWith("-") ? -1 : 1;
  const key = String(sort).replace(/^-/, "");
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "name",
    "status",
    "criticality",
    "currentStatus",
    "availability",
    "priority",
    "severity",
  ]);

  return allowed.has(key) ? { [key]: direction } : { createdAt: -1 };
};

export const listCollection = async (
  Model,
  { user, query = {}, searchFields = [], extraFilters = {} } = {}
) => {
  const { limit, page, skip } = buildPagination(query);
  const filters = {
    ...getEnterpriseScope(user, query),
    ...extraFilters,
  };

  if (query.status) {
    filters.status = String(query.status);
  }

  if (query.search && searchFields.length > 0) {
    const search = String(query.search).trim();
    filters.$or = searchFields.map((field) => ({
      [field]: new RegExp(search, "i"),
    }));
  }

  const [items, total] = await Promise.all([
    Model.find(filters).sort(buildSort(query.sort)).skip(skip).limit(limit).lean(),
    Model.countDocuments(filters),
  ]);

  return {
    items: items.map(serialize),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const buildPlantRollups = ({ machines, plants, workOrders, notifications }) =>
  plants.map((plant) => {
    const plantMachines = machines.filter((machine) => machine.plantId === plant.plantId);
    const plantOrders = workOrders.filter((order) => order.plantId === plant.plantId || plantMachines.some((machine) => machine.machineId === order.machineId));
    const plantAlerts = notifications.filter((alert) => alert.plantId === plant.plantId || plantMachines.some((machine) => machine.machineId === alert.machineId));
    const activeOrders = plantOrders.filter((order) =>
      ACTIVE_WORK_ORDER_STATUSES.includes(order.status)
    );
    const averageHealth = round(average(plantMachines.map(getHealth)), 1);
    const failureRate = round(average(plantMachines.map(getFailureProbability)), 1);
    const downtimeHours = round(sum(plantOrders.map((order) => order.estimatedDowntimeHours || 0)), 1);
    const energyUsage = round(sum(plantMachines.map(getEnergy)), 1);
    const maintenanceCost = Math.round(
      sum(plantOrders.map((order) => order.actualCost || order.estimatedRepairCost || 0))
    );
    const availability = round(
      plantMachines.length
        ? (plantMachines.filter((machine) => machine.status === "Running").length /
            plantMachines.length) *
            100
        : 0,
      1
    );
    const performance = round(Math.max(0, Math.min(100, averageHealth * 0.62 + availability * 0.38)), 1);
    const quality = round(Math.max(75, 100 - failureRate * 0.18), 1);
    const oee = round((availability / 100) * (performance / 100) * (quality / 100) * 100, 1);

    return {
      plantId: plant.plantId,
      name: plant.name,
      country: plant.country || "India",
      regionId: plant.regionId || "",
      machineCount: plantMachines.length,
      criticalMachines: plantMachines.filter(
        (machine) => machine.status === "Critical" || getFailureProbability(machine) >= 80
      ).length,
      averageHealth,
      failureRate,
      downtimeHours,
      energyUsage,
      maintenanceCost,
      activeWorkOrders: activeOrders.length,
      criticalAlerts: plantAlerts.filter((alert) => alert.severity === "Critical" && !alert.read).length,
      availability,
      performance,
      quality,
      oee,
    };
  });

const buildTrends = (machines, workOrders) => {
  const labels = ["T-5", "T-4", "T-3", "T-2", "T-1", "Now"];
  const health = average(machines.map(getHealth));
  const energy = sum(machines.map(getEnergy));
  const downtime = sum(workOrders.map((order) => order.estimatedDowntimeHours || 0));
  const cost = sum(workOrders.map((order) => order.actualCost || order.estimatedRepairCost || 0));

  return labels.map((label, index) => {
    const drift = labels.length - index - 1;

    return {
      time: label,
      health: round(Math.max(0, health - drift * 0.8), 1),
      downtime: round(Math.max(0, downtime * (0.45 + index * 0.11)), 1),
      energy: round(Math.max(0, energy * (0.55 + index * 0.09)), 1),
      maintenanceCost: Math.round(cost * (0.45 + index * 0.11)),
      risk: round(average(machines.map(getFailureProbability)) + index * 0.7, 1),
    };
  });
};

const buildTopAssets = (machines, assets) =>
  machines
    .map((machine) => {
      const asset = assets.find((item) => item.machineId === machine.machineId);

      return {
        machineId: machine.machineId,
        assetId: asset?.assetId || machine.assetId || "",
        name: machine.name,
        plantId: machine.plantId || "",
        status: machine.status,
        criticality: asset?.criticality || machine.criticality || "Medium",
        health: round(getHealth(machine), 1),
        failureProbability: round(getFailureProbability(machine), 1),
        remainingUsefulLifeHours: Math.round(getRul(machine)),
        replacementCost: Number(asset?.replacementCost || machine.replacementCost || 0),
      };
    })
    .sort(
      (a, b) =>
        b.failureProbability - a.failureProbability ||
        a.remainingUsefulLifeHours - b.remainingUsefulLifeHours
    )
    .slice(0, 12);

const buildFailureDistribution = (machines) =>
  machines.reduce(
    (acc, machine) => {
      const probability = getFailureProbability(machine);

      if (probability >= 80) acc.Critical += 1;
      else if (probability >= 60) acc.High += 1;
      else if (probability >= 35) acc.Medium += 1;
      else acc.Low += 1;

      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );

export const buildEnterpriseDashboard = async ({ user = {}, query = {} } = {}) => {
  const scope = getEnterpriseScope(user, query);
  const [organizations, regions, plants, assets, machines, workOrders, notifications, engineers, aiOverview] =
    await Promise.all([
      Organization.find(scope.organizationId ? { _id: scope.organizationId } : {}).lean(),
      Region.find(scope.organizationId ? { organizationId: scope.organizationId } : {}).lean(),
      Plant.find(scope.organizationId ? { organizationId: scope.organizationId } : {}).lean(),
      Asset.find(scope).lean(),
      Machine.find(scope).lean(),
      WorkOrder.find(scope).sort({ createdAt: -1 }).limit(1000).lean(),
      Notification.find(scope).sort({ createdAt: -1 }).limit(1000).lean(),
      Engineer.find(scope).lean(),
      buildAIOverview({ limit: 500 }).catch(() => null),
    ]);
  const plantRollups = buildPlantRollups({
    machines,
    notifications,
    plants,
    workOrders,
  });
  const activeOrders = workOrders.filter((order) =>
    ACTIVE_WORK_ORDER_STATUSES.includes(order.status)
  );
  const downtimeHours = round(sum(workOrders.map((order) => order.estimatedDowntimeHours || 0)), 1);
  const maintenanceCost = Math.round(
    sum(workOrders.map((order) => order.actualCost || order.estimatedRepairCost || 0))
  );
  const downtimeCost = Math.round(downtimeHours * Number(process.env.DOWNTIME_COST_PER_HOUR || 12500));
  const revenueImpact = Math.round(downtimeCost + maintenanceCost);
  const availability = round(
    machines.length
      ? (machines.filter((machine) => machine.status === "Running").length / machines.length) * 100
      : 0,
    1
  );
  const averageHealth = round(average(machines.map(getHealth)), 1);
  const averageFailure = round(average(machines.map(getFailureProbability)), 1);
  const performance = round(Math.max(0, Math.min(100, averageHealth * 0.62 + availability * 0.38)), 1);
  const quality = round(Math.max(75, 100 - averageFailure * 0.18), 1);
  const oee = round((availability / 100) * (performance / 100) * (quality / 100) * 100, 1);
  const enterpriseHealthScore = round(
    Math.max(
      0,
      Math.min(
        100,
        averageHealth * 0.42 +
          oee * 0.26 +
          (100 - averageFailure) * 0.22 +
          (engineers.length
            ? (engineers.filter((engineer) => engineer.availability === "Available").length /
                engineers.length) *
              10
            : 5)
      )
    ),
    1
  );
  const bestPlant = [...plantRollups].sort((a, b) => b.oee - a.oee)[0] || null;
  const worstPlant = [...plantRollups].sort((a, b) => a.oee - b.oee)[0] || null;
  const highestDowntime = [...plantRollups].sort((a, b) => b.downtimeHours - a.downtimeHours)[0] || null;
  const highestEnergy = [...plantRollups].sort((a, b) => b.energyUsage - a.energyUsage)[0] || null;
  const highestFailureRate = [...plantRollups].sort((a, b) => b.failureRate - a.failureRate)[0] || null;
  const topFailingAssets = buildTopAssets(machines, assets);
  const aiRecommendations = [
    ...(aiOverview?.recommendations || []).map(
      (item) => `${item.machineName || item.machineId}: ${item.recommendation}`
    ),
  ];

  if (highestFailureRate?.failureRate >= 60) {
    aiRecommendations.push(
      `Prioritize reliability review at ${highestFailureRate.name}; failure rate is ${highestFailureRate.failureRate}%.`
    );
  }

  if (highestEnergy?.energyUsage > average(plantRollups.map((plant) => plant.energyUsage)) * 1.25) {
    aiRecommendations.push(
      `Launch energy optimization at ${highestEnergy.name}; consumption is highest in the enterprise.`
    );
  }

  const dashboard = {
    generatedAt: new Date().toISOString(),
    scope,
    hierarchy: {
      organizations: organizations.length,
      regions: regions.length,
      plants: plants.length,
      assets: assets.length || machines.length,
      engineers: engineers.length,
    },
    kpis: {
      enterpriseHealthScore,
      oee,
      availability,
      performance,
      quality,
      revenueImpact,
      maintenanceCost,
      downtimeCost,
      downtimeHours,
      energyUsage: round(sum(machines.map(getEnergy)), 1),
      aiRisk: averageFailure,
      activeWorkOrders: activeOrders.length,
      criticalAlerts: notifications.filter((item) => item.severity === "Critical" && !item.read).length,
    },
    fleet: {
      overallFleetHealth: averageHealth,
      criticalMachines: topFailingAssets.filter((asset) => asset.failureProbability >= 80).length,
      healthRanking: topFailingAssets.slice().sort((a, b) => a.health - b.health),
      failureDistribution: buildFailureDistribution(machines),
      riskHeatmap: plantRollups.map((plant) => ({
        plantId: plant.plantId,
        name: plant.name,
        x: plant.failureRate,
        y: plant.averageHealth,
        z: plant.criticalMachines + plant.activeWorkOrders,
        risk: plant.failureRate,
      })),
      maintenanceCost,
      downtimeTrend: buildTrends(machines, workOrders).map((point) => ({
        time: point.time,
        value: point.downtime,
      })),
      energyTrend: buildTrends(machines, workOrders).map((point) => ({
        time: point.time,
        value: point.energy,
      })),
      plantComparison: plantRollups,
      machineComparison: topFailingAssets,
    },
    crossPlantAnalytics: {
      bestPerformingPlant: bestPlant,
      worstPerformingPlant: worstPlant,
      highestDowntime,
      highestEnergyConsumption: highestEnergy,
      highestFailureRate,
      lowestOee: worstPlant,
      maintenanceBenchmark: round(average(plantRollups.map((plant) => plant.maintenanceCost)), 1),
      costComparison: plantRollups.map((plant) => ({
        plantId: plant.plantId,
        name: plant.name,
        maintenanceCost: plant.maintenanceCost,
        downtimeCost: Math.round(plant.downtimeHours * Number(process.env.DOWNTIME_COST_PER_HOUR || 12500)),
      })),
      recommendations: aiRecommendations.slice(0, 8),
    },
    trends: buildTrends(machines, workOrders),
    topFailingAssets,
    plantComparison: plantRollups,
    recentAlerts: notifications.slice(0, 10),
    recentWorkOrders: workOrders.slice(0, 10),
    engineers: engineers.slice(0, 12),
  };

  await FleetAnalytics.create({
    organizationId: scope.organizationId || "",
    plantId: scope.plantId || "",
    period: "daily",
    metrics: dashboard.kpis,
    plantComparison: plantRollups,
    machineComparison: topFailingAssets,
    recommendations: dashboard.crossPlantAnalytics.recommendations,
    generatedAt: new Date(),
  }).catch((error) => {
    console.error("Fleet analytics snapshot write failed:", error.message);
  });

  return dashboard;
};

export const createTenant = (payload) =>
  Tenant.create({
    dataResidency: payload.dataResidency,
    domain: payload.domain,
    industry: payload.industry,
    name: String(payload.name || "").trim(),
    tenantId: payload.tenantId || makeEnterpriseId("TENANT", payload.name),
  });

export const createRegion = (payload) =>
  Region.create({
    country: String(payload.country || "").trim(),
    name: String(payload.name || "").trim(),
    organizationId: String(payload.organizationId || "").trim(),
    regionId: payload.regionId || makeEnterpriseId("REGION", payload.name),
    tenantId: payload.tenantId || "",
    timezone: payload.timezone,
  });

export const createArea = (payload) =>
  Area.create({
    areaId: payload.areaId || makeEnterpriseId("AREA", payload.name),
    name: String(payload.name || "").trim(),
    organizationId: payload.organizationId || "",
    plantId: String(payload.plantId || "").trim(),
    productionLineId: payload.productionLineId || "",
    tenantId: payload.tenantId || "",
    type: payload.type,
  });

export const createAsset = async (payload) => {
  const asset = await Asset.create({
    ...payload,
    assetId: payload.assetId || makeEnterpriseId("ASSET", payload.name || payload.machineId),
    lifecycleHistory: [
      {
        actor: payload.actor || "System",
        notes: "Asset created in enterprise asset registry.",
        state: payload.lifecycleState || "Operational",
      },
    ],
    name: String(payload.name || payload.machineId || "").trim(),
    plantId: String(payload.plantId || "").trim(),
    machineId: String(payload.machineId || "").trim(),
  });

  await Machine.updateOne(
    { machineId: asset.machineId },
    {
      $set: {
        areaId: asset.areaId,
        assetId: asset.assetId,
        assetImage: asset.assetImage,
        assetValue: asset.assetValue,
        barcode: asset.barcode,
        criticality: asset.criticality,
        expectedLifeYears: asset.expectedLifeYears,
        installationDate: asset.installationDate,
        lifecycleState: asset.lifecycleState,
        manufacturer: asset.manufacturer,
        maintenanceCost: asset.maintenanceCost,
        model: asset.model,
        qrCode: asset.qrCode,
        replacementCost: asset.replacementCost,
        serialNumber: asset.serialNumber,
        warrantyExpiry: asset.warrantyExpiry,
      },
    }
  );

  return asset;
};

export const updateAssetLifecycle = async ({ assetId, state, actor, notes }) => {
  const asset = await Asset.findOneAndUpdate(
    { assetId },
    {
      $set: {
        lifecycleState: state,
        currentStatus: state === "Maintenance" || state === "Repair" ? "Maintenance" : undefined,
      },
      $push: {
        lifecycleHistory: {
          actor: actor || "Operator",
          notes: notes || "",
          state,
          at: new Date(),
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (asset) {
    await Machine.updateOne(
      { machineId: asset.machineId },
      {
        $set: {
          lifecycleState: asset.lifecycleState,
          status: asset.currentStatus,
        },
      }
    );
  }

  return asset;
};

export const createEngineer = (payload) =>
  Engineer.create({
    ...payload,
    engineerId: payload.engineerId || makeEnterpriseId("ENG", payload.name),
    name: String(payload.name || "").trim(),
  });

export const createNotificationRule = (payload) =>
  NotificationRule.create({
    ...payload,
    name: String(payload.name || "").trim(),
  });

export const createReportSchedule = (payload) =>
  ReportSchedule.create({
    ...payload,
    name: String(payload.name || "").trim(),
    reportType: String(payload.reportType || "executive"),
  });

export { serialize };
