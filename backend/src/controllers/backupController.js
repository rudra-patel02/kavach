import AuditLog from "../models/auditLog.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import WorkOrder from "../models/workOrder.js";
import Device from "../models/device.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import { createAuditLog } from "../services/auditService.js";

const collections = {
  auditLogs: AuditLog,
  devices: Device,
  machines: Machine,
  notifications: Notification,
  organizations: Organization,
  plants: Plant,
  users: User,
  workOrders: WorkOrder,
};

const sanitizeDocs = (docs) =>
  docs.map((doc) => {
    const value = { ...doc };
    delete value.password;
    delete value.refreshToken;
    return value;
  });

export const exportBackup = async (req, res) => {
  try {
    const data = {};

    for (const [name, Model] of Object.entries(collections)) {
      data[name] = sanitizeDocs(await Model.find().lean());
    }

    await createAuditLog({
      action: "BACKUP_EXPORTED",
      metadata: { collections: Object.keys(data) },
      req,
      resourceType: "backup",
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kavach-backup-${Date.now()}.json"`
    );
    res.json({
      exportedAt: new Date().toISOString(),
      service: "KAVACH",
      version: "12.0.0",
      data,
    });
  } catch (error) {
    console.error("Backup export failed:", error);
    res.status(500).json({ message: "Backup export failed" });
  }
};

export const exportConfiguration = async (req, res) => {
  try {
    res.json({
      configuration: {
        company: {
          industry: process.env.COMPANY_INDUSTRY,
          name: process.env.COMPANY_NAME,
          site: process.env.COMPANY_SITE,
          timezone: process.env.COMPANY_TIMEZONE,
        },
        iot: {
          enabled: process.env.IOT_ENABLED,
          mqttBrokerUrl: process.env.MQTT_BROKER_URL,
        },
        reports: {
          carbonKgPerKwh: process.env.CARBON_KG_PER_KWH,
          energyCostPerKwh: process.env.ENERGY_COST_PER_KWH,
        },
      },
      exportedAt: new Date().toISOString(),
      success: true,
    });
  } catch (error) {
    console.error("Configuration export failed:", error);
    res.status(500).json({ message: "Configuration export failed" });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    const payload = req.body?.data || {};
    const dryRun = req.query.dryRun !== "false";
    const summary = Object.fromEntries(
      Object.keys(collections).map((name) => [
        name,
        Array.isArray(payload[name]) ? payload[name].length : 0,
      ])
    );

    await createAuditLog({
      action: dryRun ? "BACKUP_RESTORE_DRY_RUN" : "BACKUP_RESTORE_REQUESTED",
      metadata: { dryRun, summary },
      req,
      resourceType: "backup",
    });

    if (!dryRun) {
      return res.status(501).json({
        message:
          "Restore execution requires an operator-approved maintenance window. Dry run summary is available.",
        summary,
      });
    }

    res.json({
      dryRun,
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Backup restore failed:", error);
    res.status(500).json({ message: "Backup restore failed" });
  }
};
