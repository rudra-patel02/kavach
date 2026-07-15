import bcrypt from "bcryptjs";

import FleetAnalytics from "../models/fleetAnalytics.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Prediction from "../models/Prediction.js";
import Telemetry from "../models/telemetry.js";
import Tenant from "../models/tenant.js";
import User from "../models/user.js";
import WorkOrder from "../models/workOrder.js";

export const DEMO_TENANT_ID = "TENANT-DEMO";
export const DEMO_ORGANIZATION_CODE = "ORG-DEMO";

const now = () => new Date();
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

const machineTemplates = [
  ["DM-1001", "Compressor Alpha", "Utilities", "Running", 92, 12, 320, 186],
  ["DM-1002", "CNC Mill Bravo", "Machining", "Warning", 71, 48, 128, 242],
  ["DM-1003", "Packaging Line Charlie", "Packaging", "Running", 88, 18, 260, 154],
  ["DM-2001", "Pump Delta", "Process", "Critical", 39, 86, 34, 96],
  ["DM-2002", "Robot Welder Echo", "Assembly", "Warning", 64, 58, 90, 221],
  ["DM-2003", "Boiler Foxtrot", "Utilities", "Running", 81, 28, 210, 310],
];

export const resetDemoData = async () => {
  const filter = { tenantId: DEMO_TENANT_ID };

  const [
    fleetAnalytics,
    machines,
    notifications,
    organizations,
    plants,
    predictions,
    telemetry,
    tenants,
    users,
    workOrders,
  ] = await Promise.all([
    FleetAnalytics.deleteMany(filter),
    Machine.deleteMany(filter),
    Notification.deleteMany(filter),
    Organization.deleteMany(filter),
    Plant.deleteMany(filter),
    Prediction.deleteMany(filter),
    Telemetry.deleteMany(filter),
    Tenant.deleteMany(filter),
    User.deleteMany(filter),
    WorkOrder.deleteMany(filter),
  ]);

  return {
    fleetAnalytics: fleetAnalytics.deletedCount,
    machines: machines.deletedCount,
    notifications: notifications.deletedCount,
    organizations: organizations.deletedCount,
    plants: plants.deletedCount,
    predictions: predictions.deletedCount,
    telemetry: telemetry.deletedCount,
    tenants: tenants.deletedCount,
    users: users.deletedCount,
    workOrders: workOrders.deletedCount,
  };
};

export const generateDemoData = async () => {
  await resetDemoData();

  const tenant = await Tenant.create({
    dataResidency: "India",
    domain: "demo.kavach.local",
    industry: "Industrial Manufacturing",
    name: "KAVACH Demo Industries",
    settings: {
      demoMode: true,
      resettable: true,
    },
    subscriptionTier: "Enterprise",
    tenantId: DEMO_TENANT_ID,
  });
  const organization = await Organization.create({
    branding: {
      accentColor: "#22c55e",
      logoUrl: "",
      primaryColor: "#0891b2",
      theme: "dark",
    },
    headquartersCountry: "India",
    headquartersRegion: "West",
    industry: "Industrial Manufacturing",
    name: "KAVACH Demo Industries",
    onboarding: {
      completedAt: now(),
      status: "Completed",
    },
    organizationCode: DEMO_ORGANIZATION_CODE,
    settings: {
      aiAssistantEnabled: true,
      demoMode: true,
      reportTimezone: "Asia/Calcutta",
    },
    tenantId: DEMO_TENANT_ID,
  });
  const plants = await Plant.insertMany([
    {
      capacityUnitsPerDay: 4800,
      country: "India",
      location: "Pune",
      name: "Pune Assembly Plant",
      organizationId: String(organization._id),
      plantId: "PLANT-DEMO-PUNE",
      plantManager: "Anika Rao",
      settings: { energyTargetKwh: 1500, oeeTarget: 86, shiftPattern: "24x7" },
      tenantId: DEMO_TENANT_ID,
    },
    {
      capacityUnitsPerDay: 3900,
      country: "India",
      location: "Chennai",
      name: "Chennai Process Plant",
      organizationId: String(organization._id),
      plantId: "PLANT-DEMO-CHENNAI",
      plantManager: "Rohan Mehta",
      settings: { energyTargetKwh: 1300, oeeTarget: 84, shiftPattern: "3 Shift" },
      tenantId: DEMO_TENANT_ID,
    },
  ]);
  const password = await bcrypt.hash("KavachDemo@2026", 10);
  const users = await User.insertMany([
    {
      activePlantId: plants[0].plantId,
      department: "Operations",
      email: "demo.admin@kavach.local",
      name: "Demo Admin",
      organizationId: String(organization._id),
      password,
      permissions: ["*"],
      plantIds: plants.map((plant) => plant.plantId),
      role: "Super Admin",
      tenantId: DEMO_TENANT_ID,
    },
    {
      activePlantId: plants[1].plantId,
      department: "Maintenance",
      email: "demo.engineer@kavach.local",
      name: "Demo Engineer",
      organizationId: String(organization._id),
      password,
      plantIds: plants.map((plant) => plant.plantId),
      role: "Maintenance Engineer",
      tenantId: DEMO_TENANT_ID,
    },
  ]);
  const machines = await Machine.insertMany(
    machineTemplates.map(
      ([machineId, name, department, status, health, risk, rul, energy], index) => {
        const plant = plants[index < 3 ? 0 : 1];

        return {
          aiAnomalySeverity: risk >= 80 ? "Critical" : risk >= 50 ? "High" : "Low",
          aiConfidencePercent: 91 - index,
          aiFailureProbability: risk,
          aiHealthPercent: health,
          aiPrediction: {
            failureRisk: risk >= 80 ? "Critical" : risk >= 50 ? "High" : "Low",
            maintenanceInDays: Math.max(1, Math.round(rul / 24)),
            maintenancePriority: risk >= 80 ? "Critical" : risk >= 50 ? "High" : "Low",
            recommendation:
              risk >= 80
                ? "Schedule emergency inspection and isolate operating load."
                : "Monitor trend and schedule planned maintenance.",
          },
          aiRemainingUsefulLifeHours: rul,
          criticality: risk >= 80 ? "Critical" : risk >= 50 ? "High" : "Medium",
          department,
          efficiency: Math.max(55, health - 2),
          energyConsumed: energy,
          health,
          machineId,
          name,
          oee: Math.max(40, Math.round(health * 0.9)),
          organizationId: String(organization._id),
          plantId: plant.plantId,
          power: Math.round(energy / 5),
          predictedFailureProbability: risk,
          remainingUsefulLifeHours: rul,
          status,
          temperature: 28 + index * 3,
          tenantId: DEMO_TENANT_ID,
          vibration: Number((0.18 + index * 0.08).toFixed(2)),
          ...(index === 0
            ? {
                linkedDeviceId: "esp32-dht22-01",
                liveTelemetryEnabled: true,
                telemetrySource: "iot",
              }
            : {}),
        };
      }
    )
  );
  const predictions = await Prediction.insertMany(
    machines.map((machine, index) => ({
      confidencePercent: machine.aiConfidencePercent,
      department: machine.department,
      healthPercent: machine.aiHealthPercent,
      machineId: machine.machineId,
      machineName: machine.name,
      organizationId: String(organization._id),
      plantId: machine.plantId,
      recommendations: [
        {
          priority: machine.aiFailureProbability >= 80 ? "Critical" : "High",
          recommendation: machine.aiPrediction.recommendation,
        },
      ],
      remainingUsefulLife: {
        remainingHours: machine.aiRemainingUsefulLifeHours,
        riskPercent: machine.aiFailureProbability,
      },
      riskPercent: machine.aiFailureProbability,
      rootCauseSummary:
        machine.aiFailureProbability >= 80
          ? "Bearing heat and vibration trend breach."
          : "Wear trend under observation.",
      tenantId: DEMO_TENANT_ID,
      timestamp: hoursAgo(index),
    }))
  );
  const notifications = await Notification.insertMany(
    machines
      .filter((machine) => machine.aiFailureProbability >= 48)
      .map((machine, index) => ({
        category: "maintenance",
        channels: ["push", "email"],
        dedupeKey: `demo:${machine.machineId}`,
        estimatedDowntimeHours: machine.aiFailureProbability >= 80 ? 6 : 2,
        failureProbability: machine.aiFailureProbability,
        machineId: machine.machineId,
        machineName: machine.name,
        message: `${machine.name} has ${machine.aiFailureProbability}% predicted failure probability.`,
        organizationId: String(organization._id),
        plantId: machine.plantId,
        priority: machine.aiFailureProbability >= 80 ? "P1" : "P2",
        severity: machine.aiFailureProbability >= 80 ? "Critical" : "High",
        suggestedAction: machine.aiPrediction.recommendation,
        tenantId: DEMO_TENANT_ID,
        title: `AI risk detected: ${machine.name}`,
        type: "failure_probability",
        value: machine.aiFailureProbability,
        threshold: 45,
        createdAt: hoursAgo(index + 1),
      }))
  );
  const workOrders = await WorkOrder.insertMany(
    notifications.map((notification, index) => ({
      aiRecommendation: notification.suggestedAction,
      createdBy: "KAVACH Demo Mode",
      department: machines.find((machine) => machine.machineId === notification.machineId)?.department,
      description: notification.message,
      estimatedDowntimeHours: notification.estimatedDowntimeHours,
      estimatedHours: notification.estimatedDowntimeHours + 1,
      estimatedRepairCost: notification.severity === "Critical" ? 18000 : 8500,
      machineId: notification.machineId,
      machineName: notification.machineName,
      maintenanceType: notification.severity === "Critical" ? "Emergency" : "Predictive",
      notificationHistory: [
        {
          createdAt: notification.createdAt || now(),
          message: notification.message,
          notificationId: String(notification._id),
          severity: notification.severity,
          title: notification.title,
        },
      ],
      organizationId: String(organization._id),
      plantId: notification.plantId,
      priority: notification.severity === "Critical" ? "CRITICAL" : "HIGH",
      probableCause:
        notification.severity === "Critical"
          ? "Vibration and heat anomaly exceeded operating envelope."
          : "Predictive trend requires planned inspection.",
      status: index === 0 ? "ASSIGNED" : "OPEN",
      tenantId: DEMO_TENANT_ID,
      workOrderId: `WO-DEMO-${index + 1}`,
    }))
  );
  const telemetry = await Telemetry.insertMany(
    machines.flatMap((machine) =>
      Array.from({ length: 6 }, (_, index) => ({
        deviceId: `DEV-${machine.machineId}`,
        machineId: machine.machineId,
        metrics: {
          current: machine.current + index,
          energy: machine.energyConsumed + index * 3,
          humidity: machine.humidity,
          power: machine.power + index,
          pressure: machine.pressure,
          rpm: machine.rpm - index * 10,
          temperature: machine.temperature + index,
          vibration: Number((machine.vibration + index * 0.01).toFixed(2)),
          voltage: machine.voltage,
        },
        organizationId: String(organization._id),
        plantId: machine.plantId,
        source: "simulator",
        tenantId: DEMO_TENANT_ID,
        timestamp: hoursAgo(index),
      }))
    )
  );
  const fleetAnalytics = await FleetAnalytics.create({
    metrics: {
      activeWorkOrders: workOrders.length,
      criticalAlerts: notifications.filter((notification) => notification.severity === "Critical").length,
      demoMode: true,
      machines: machines.length,
    },
    organizationId: String(organization._id),
    period: "daily",
    plantId: "",
    recommendations: [
      "Prioritize Pump Delta inspection before the next production shift.",
      "Shift discretionary load from Chennai utilities during peak tariff window.",
    ],
    tenantId: DEMO_TENANT_ID,
  });

  return {
    credentials: {
      adminEmail: "demo.admin@kavach.local",
      engineerEmail: "demo.engineer@kavach.local",
      password: "KavachDemo@2026",
    },
    counts: {
      fleetAnalytics: 1,
      machines: machines.length,
      notifications: notifications.length,
      organizations: 1,
      plants: plants.length,
      predictions: predictions.length,
      telemetry: telemetry.length,
      tenants: 1,
      users: users.length,
      workOrders: workOrders.length,
    },
    demo: {
      fleetAnalyticsId: String(fleetAnalytics._id),
      organizationId: String(organization._id),
      tenantId: tenant.tenantId,
    },
  };
};
