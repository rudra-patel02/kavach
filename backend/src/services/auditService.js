import AuditLog from "../models/auditLog.js";

const safeClone = (value) => {
  if (value === undefined) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

export const createAuditLog = async ({
  action,
  metadata = {},
  newValue = null,
  oldValue = null,
  req,
  resourceId = "",
  resourceType,
}) => {
  try {
    await AuditLog.create({
      action,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      metadata: safeClone(metadata),
      newValue: safeClone(newValue),
      oldValue: safeClone(oldValue),
      organizationId: req?.user?.organizationId || "",
      plantId:
        req?.user?.activePlantId ||
        req?.body?.plantId ||
        req?.query?.plantId ||
        "",
      requestId: req?.id || "",
      resourceId: String(resourceId || ""),
      resourceType,
      role: req?.user?.role || "",
      userEmail: req?.user?.email || "",
      userId: req?.user?.id || "",
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

export const listAuditLogs = async ({ action, limit = 200, resourceType } = {}) => {
  const filters = {};

  if (action) filters.action = action;
  if (resourceType) filters.resourceType = resourceType;

  return AuditLog.find(filters)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 200, 1000))
    .lean();
};
