import { listAuditLogs } from "../services/auditService.js";

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await listAuditLogs(req.query);

    res.json({
      logs: logs.map((log) => ({
        id: String(log._id),
        action: log.action,
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
        ip: log.ip,
        metadata: log.metadata,
        newValue: log.newValue,
        oldValue: log.oldValue,
        plantId: log.plantId,
        requestId: log.requestId,
        resourceId: log.resourceId,
        resourceType: log.resourceType,
        role: log.role,
        userEmail: log.userEmail,
        userId: log.userId,
      })),
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};
