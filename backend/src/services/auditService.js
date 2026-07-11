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
  severity,
  status = "success",
}) => {
  try {
    const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 365);
    const retentionExpiresAt = Number.isFinite(retentionDays)
      ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      : undefined;
    const actionSeverity =
      severity ||
      (/(DELETE|FAILED|CRITICAL|ROLE|PERMISSION|SECURITY)/i.test(action)
        ? "Warning"
        : "Info");

    await AuditLog.create({
      action,
      browser: req?.headers?.["user-agent"] || "",
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      location:
        req?.headers?.["x-location"] ||
        req?.headers?.["cf-ipcountry"] ||
        req?.body?.location ||
        "",
      metadata: safeClone(metadata),
      newValue: safeClone(newValue),
      oldValue: safeClone(oldValue),
      tenantId: req?.user?.tenantId || req?.body?.tenantId || req?.query?.tenantId || "",
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
      sessionId:
        req?.headers?.["x-session-id"] ||
        req?.headers?.["x-request-id"] ||
        req?.id ||
        "",
      severity: actionSeverity,
      status,
      retentionExpiresAt,
      userEmail: req?.user?.email || "",
      userId: req?.user?.id || "",
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

export const listAuditLogs = async ({
  action,
  from,
  limit = 200,
  organizationId,
  plantId,
  query,
  resourceType,
  severity,
  status,
  tenantId,
  to,
  userEmail,
} = {}) => {
  const filters = {};

  if (action) filters.action = action;
  if (resourceType) filters.resourceType = resourceType;
  if (severity) filters.severity = severity;
  if (status) filters.status = status;
  if (tenantId) filters.tenantId = tenantId;
  if (organizationId) filters.organizationId = organizationId;
  if (plantId) filters.plantId = plantId;
  if (userEmail) filters.userEmail = new RegExp(String(userEmail), "i");

  if (from || to) {
    filters.createdAt = {};

    if (from) {
      const fromDate = new Date(from);

      if (!Number.isNaN(fromDate.getTime())) {
        filters.createdAt.$gte = fromDate;
      }
    }

    if (to) {
      const toDate = new Date(to);

      if (!Number.isNaN(toDate.getTime())) {
        filters.createdAt.$lte = toDate;
      }
    }
  }

  if (query) {
    const search = String(query).trim();
    filters.$or = [
      { action: new RegExp(search, "i") },
      { browser: new RegExp(search, "i") },
      { ip: new RegExp(search, "i") },
      { resourceId: new RegExp(search, "i") },
      { resourceType: new RegExp(search, "i") },
      { role: new RegExp(search, "i") },
      { sessionId: new RegExp(search, "i") },
      { userEmail: new RegExp(search, "i") },
      { userId: new RegExp(search, "i") },
    ];
  }

  return AuditLog.find(filters)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 200, 1000))
    .lean();
};
