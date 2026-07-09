import fs from "node:fs/promises";
import path from "node:path";

import AuditLog from "../models/auditLog.js";
import BackupLog from "../models/backupLog.js";
import Device from "../models/device.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Tenant from "../models/tenant.js";
import User from "../models/user.js";
import WorkOrder from "../models/workOrder.js";

export const backupCollections = {
  auditLogs: { Model: AuditLog },
  devices: { Model: Device },
  machines: { identity: "machineId", Model: Machine },
  notifications: { Model: Notification },
  organizations: { identity: "name", Model: Organization },
  plants: { identity: "plantId", Model: Plant },
  tenants: { identity: "tenantId", Model: Tenant },
  users: { identity: "email", Model: User, sensitive: true },
  workOrders: { identity: "workOrderId", Model: WorkOrder },
};

const createBackupId = (type) =>
  `${type.toUpperCase()}-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`;

const getRetentionDate = () => {
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 30);
  return Number.isFinite(retentionDays)
    ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
    : undefined;
};

const getBackupDirectory = () =>
  path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), "backups"));

const sanitizeDocument = (doc, { includeSecrets = false } = {}) => {
  const value = { ...doc };
  delete value.__v;

  if (!includeSecrets) {
    delete value.password;
    delete value.refreshToken;
  }

  return value;
};

export const collectBackupData = async ({ includeSecrets = false } = {}) => {
  const data = {};

  for (const [name, config] of Object.entries(backupCollections)) {
    const query = config.sensitive && includeSecrets
      ? config.Model.find().select("+password +refreshToken").lean()
      : config.Model.find().lean();
    const docs = await query;
    data[name] = docs.map((doc) => sanitizeDocument(doc, { includeSecrets }));
  }

  return data;
};

export const buildBackupPayload = async ({ includeSecrets = false } = {}) => {
  const data = await collectBackupData({ includeSecrets });

  return {
    data,
    exportedAt: new Date().toISOString(),
    service: "KAVACH",
    version: process.env.API_VERSION || "20.0.0",
  };
};

export const summarizeBackupPayload = (payload = {}) => {
  const data = payload.data || {};

  return Object.fromEntries(
    Object.keys(backupCollections).map((name) => [
      name,
      Array.isArray(data[name]) ? data[name].length : 0,
    ])
  );
};

export const writeBackupFile = async ({ trigger = "scheduled" } = {}) => {
  const backupId = createBackupId(trigger);
  const directory = getBackupDirectory();
  const fileName = `${backupId}.json`;
  const filePath = path.join(directory, fileName);
  const log = await BackupLog.create({
    backupId,
    retentionExpiresAt: getRetentionDate(),
    startedAt: new Date(),
    status: "running",
    type: trigger === "scheduled" ? "scheduled" : "export",
  });

  try {
    await fs.mkdir(directory, { recursive: true });
    const payload = await buildBackupPayload({ includeSecrets: true });
    const body = JSON.stringify(payload, null, 2);
    await fs.writeFile(filePath, body, "utf8");

    const documentCounts = summarizeBackupPayload(payload);
    await BackupLog.updateOne(
      { _id: log._id },
      {
        collections: Object.keys(documentCounts),
        completedAt: new Date(),
        documentCounts,
        fileName,
        fileSizeBytes: Buffer.byteLength(body),
        status: "completed",
      }
    );

    return { backupId, documentCounts, fileName, filePath };
  } catch (error) {
    await BackupLog.updateOne(
      { _id: log._id },
      {
        completedAt: new Date(),
        error: error.message,
        status: "failed",
      }
    );
    throw error;
  }
};

const getRestoreFilter = (name, doc, identity) => {
  if (doc._id) {
    return { _id: doc._id };
  }

  if (identity && doc[identity]) {
    return { [identity]: doc[identity] };
  }

  return null;
};

export const restoreBackupPayload = async ({ dryRun = true, payload }) => {
  const data = payload?.data || {};
  const backupId = createBackupId("restore");
  const summary = summarizeBackupPayload(payload);
  const log = await BackupLog.create({
    backupId,
    collections: Object.keys(summary),
    documentCounts: summary,
    retentionExpiresAt: getRetentionDate(),
    startedAt: new Date(),
    status: dryRun ? "dry_run" : "running",
    type: "restore",
  });

  if (dryRun) {
    await BackupLog.updateOne(
      { _id: log._id },
      { completedAt: new Date(), status: "dry_run" }
    );
    return { backupId, dryRun, restored: {}, skipped: {}, summary };
  }

  const restored = {};
  const skipped = {};

  try {
    for (const [name, config] of Object.entries(backupCollections)) {
      const docs = Array.isArray(data[name]) ? data[name] : [];
      restored[name] = 0;
      skipped[name] = 0;

      for (const rawDoc of docs) {
        const doc = sanitizeDocument(rawDoc, { includeSecrets: true });
        const filter = getRestoreFilter(name, doc, config.identity);

        if (!filter) {
          skipped[name] += 1;
          continue;
        }

        if (name === "users" && !doc.password) {
          await config.Model.updateOne(filter, { $set: doc }, { upsert: false });
        } else {
          await config.Model.updateOne(filter, { $set: doc }, { upsert: true });
        }

        restored[name] += 1;
      }
    }

    await BackupLog.updateOne(
      { _id: log._id },
      {
        completedAt: new Date(),
        metadata: { restored, skipped },
        status: "completed",
      }
    );

    return { backupId, dryRun, restored, skipped, summary };
  } catch (error) {
    await BackupLog.updateOne(
      { _id: log._id },
      {
        completedAt: new Date(),
        error: error.message,
        metadata: { restored, skipped },
        status: "failed",
      }
    );
    throw error;
  }
};

export const startBackupScheduler = ({ enabled = false } = {}) => {
  if (!enabled) {
    return () => {};
  }

  const intervalMs = Number(process.env.BACKUP_SCHEDULE_INTERVAL_MS || 24 * 60 * 60 * 1000);
  const timer = setInterval(() => {
    writeBackupFile({ trigger: "scheduled" }).catch((error) => {
      console.error("Scheduled backup failed:", error.message);
    });
  }, intervalMs);

  timer.unref?.();
  return () => clearInterval(timer);
};
