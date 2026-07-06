import BackupLog from "../models/backupLog.js";
import { createAuditLog } from "../services/auditService.js";
import {
  buildBackupPayload,
  restoreBackupPayload,
  summarizeBackupPayload,
  writeBackupFile,
} from "../services/backupService.js";

export const exportBackup = async (req, res) => {
  try {
    const payload = await buildBackupPayload({ includeSecrets: false });
    const summary = summarizeBackupPayload(payload);

    await createAuditLog({
      action: "BACKUP_EXPORTED",
      metadata: { collections: Object.keys(summary), summary },
      req,
      resourceType: "backup",
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kavach-backup-${Date.now()}.json"`
    );
    res.json({
      ...payload,
      summary,
    });
  } catch (error) {
    console.error("Backup export failed:", error);
    res.status(500).json({ message: "Backup export failed" });
  }
};

export const createServerBackup = async (req, res) => {
  try {
    const backup = await writeBackupFile({ trigger: "export" });

    await createAuditLog({
      action: "BACKUP_FILE_CREATED",
      metadata: backup,
      req,
      resourceId: backup.backupId,
      resourceType: "backup",
    });

    res.status(201).json({ backup, success: true });
  } catch (error) {
    console.error("Backup file creation failed:", error);
    res.status(500).json({ message: "Backup file creation failed" });
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
    const payload = req.body?.data ? req.body : { data: req.body?.data || {} };
    const dryRun = req.query.dryRun !== "false";

    if (!dryRun) {
      const restoreToken = String(req.body?.confirmToken || "");
      const expectedToken = process.env.BACKUP_RESTORE_TOKEN;

      if (expectedToken && restoreToken !== expectedToken) {
        return res.status(403).json({
          message: "Valid restore confirmation token is required",
        });
      }

      if (!expectedToken && req.body?.confirmRestore !== "RESTORE") {
        return res.status(400).json({
          message: "Set confirmRestore to RESTORE to execute a restore",
        });
      }
    }

    const result = await restoreBackupPayload({ dryRun, payload });

    await createAuditLog({
      action: dryRun ? "BACKUP_RESTORE_DRY_RUN" : "BACKUP_RESTORED",
      metadata: result,
      req,
      resourceId: result.backupId,
      resourceType: "backup",
    });

    res.json({
      ...result,
      success: true,
    });
  } catch (error) {
    console.error("Backup restore failed:", error);
    res.status(500).json({ message: "Backup restore failed" });
  }
};

export const getBackupLogs = async (req, res) => {
  try {
    const logs = await BackupLog.find()
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 500))
      .lean();

    res.json({ logs, success: true });
  } catch (error) {
    console.error("Backup log fetch failed:", error);
    res.status(500).json({ message: "Backup log fetch failed" });
  }
};
