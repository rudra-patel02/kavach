import { createAuditLog, listAuditLogs } from "../services/auditService.js";
import { createSimplePdf, toCsv } from "../utils/exportUtils.js";

const serializeAuditLog = (log) => ({
  id: String(log._id),
  action: log.action,
  browser: log.browser || "",
  createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
  ip: log.ip,
  location: log.location || "",
  metadata: log.metadata,
  newValue: log.newValue,
  oldValue: log.oldValue,
  plantId: log.plantId,
  requestId: log.requestId,
  resourceId: log.resourceId,
  resourceType: log.resourceType,
  role: log.role,
  sessionId: log.sessionId || "",
  severity: log.severity || "Info",
  status: log.status || "success",
  userEmail: log.userEmail,
  userId: log.userId,
});

export const getAuditLogs = async (req, res) => {
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

    res.json({
      logs: logs.map(serializeAuditLog),
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const format = String(req.query.format || req.params.format || "csv")
      .trim()
      .toLowerCase();
    const logs = (await listAuditLogs({
      ...req.query,
      limit: 1000,
      organizationId:
        req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
          ? req.tenantContext.organizationId
          : req.query.organizationId,
      plantId: req.tenantContext?.plantId || req.query.plantId,
      tenantId: req.tenantContext?.tenantId || req.query.tenantId,
    })).map(
      serializeAuditLog
    );
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    await createAuditLog({
      action: "AUDIT_EXPORTED",
      metadata: { count: logs.length, format },
      req,
      resourceType: "audit",
    });

    if (format === "pdf") {
      const pdf = createSimplePdf({
        title: "KAVACH Audit Export",
        lines: logs.map(
          (log) =>
            `${log.createdAt || ""} | ${log.severity} | ${log.action} | ${log.userEmail || "System"} | ${log.resourceType}/${log.resourceId}`
        ),
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="kavach-audit-${timestamp}.pdf"`
      );
      return res.send(pdf);
    }

    const csv = toCsv(logs, [
      { header: "Timestamp", key: "createdAt" },
      { header: "Severity", key: "severity" },
      { header: "Status", key: "status" },
      { header: "Action", key: "action" },
      { header: "Entity", key: "resourceType" },
      { header: "Entity ID", key: "resourceId" },
      { header: "User", key: "userEmail" },
      { header: "Role", key: "role" },
      { header: "IP", key: "ip" },
      { header: "Browser", key: "browser" },
      { header: "Location", key: "location" },
      { header: "Session", key: "sessionId" },
    ]);

    res.setHeader(
      "Content-Type",
      format === "excel" || format === "xlsx"
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kavach-audit-${timestamp}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    console.error("Failed to export audit logs:", error);
    res.status(500).json({ message: "Failed to export audit logs" });
  }
};
