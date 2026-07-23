import AIVisionEvent from "../models/aiVisionEvent.js";
import ConnectionLog from "../models/connectionLog.js";
import Device from "../models/device.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import {
  buildProtocolIntegrationHealth,
  buildSmartFactoryTwin,
  buildVisionOverview,
  normalizeVisionPayload,
} from "../services/smartFactoryService.js";
import { createAuditLog } from "../services/auditService.js";
import { sendErrorResponse } from "../utils/httpErrorResponse.js";

const buildCompatibleScopedQuery = (req, baseQuery = {}) => {
  const query = buildTenantScopedQuery(req, baseQuery);

  for (const field of ["tenantId", "organizationId", "plantId"]) {
    if (typeof query[field] === "string" && query[field]) {
      query[field] = { $in: [query[field], "", null] };
    }
  }

  return query;
};

export const getProtocolIntegrations = async (req, res) => {
  try {
    const [devices, connectionLogs] = await Promise.all([
      Device.find(buildCompatibleScopedQuery(req)).sort({ deviceId: 1 }).lean(),
      ConnectionLog.find(buildCompatibleScopedQuery(req)).sort({ createdAt: -1 }).limit(200).lean(),
    ]);

    res.json({
      integrations: buildProtocolIntegrationHealth({ devices, connectionLogs }),
      success: true,
    });
  } catch (error) {
    console.error("Protocol integration overview failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to load protocol integrations",
    });
  }
};

export const getSmartFactoryTwin = async (req, res) => {
  try {
    const [machines, devices, notifications, visionEvents] = await Promise.all([
      Machine.find(buildTenantScopedQuery(req)).sort({ machineId: 1 }).lean(),
      Device.find(buildCompatibleScopedQuery(req)).sort({ deviceId: 1 }).lean(),
      Notification.find(buildTenantScopedQuery(req)).sort({ createdAt: -1 }).limit(100).lean(),
      AIVisionEvent.find(buildCompatibleScopedQuery(req)).sort({ observedAt: -1 }).limit(100).lean(),
    ]);

    res.json({
      success: true,
      twin: buildSmartFactoryTwin({
        devices,
        machines,
        notifications,
        visionEvents,
      }),
    });
  } catch (error) {
    console.error("Smart factory twin failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to load smart factory twin",
    });
  }
};

export const getVisionOverview = async (req, res) => {
  try {
    const events = await AIVisionEvent.find(buildCompatibleScopedQuery(req))
      .sort({ observedAt: -1 })
      .limit(250)
      .lean();

    res.json({
      overview: buildVisionOverview(events),
      success: true,
    });
  } catch (error) {
    console.error("AI vision overview failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to load AI vision overview",
    });
  }
};

export const createVisionEvent = async (req, res) => {
  try {
    const event = await AIVisionEvent.create(
      normalizeVisionPayload(req.body, {
        organizationId: req.user?.organizationId,
        plantId: req.tenantContext?.plantId || req.user?.activePlantId,
        tenantId: req.user?.tenantId || req.tenantContext?.tenantId,
      })
    );

    await createAuditLog({
      action: "AI_VISION_EVENT_CREATED",
      metadata: {
        cameraId: event.cameraId,
        eventType: event.eventType,
        severity: event.severity,
      },
      req,
      resourceId: event.eventId,
      resourceType: "ai-vision-event",
    });

    req.app.get("machineGateway")?.emit?.("ai:vision:event", event.toObject());

    res.status(201).json({
      event,
      success: true,
    });
  } catch (error) {
    console.error("AI vision event ingestion failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to create AI vision event",
    });
  }
};
