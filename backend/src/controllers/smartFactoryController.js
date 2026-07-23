import AIVisionCamera from "../models/aiVisionCamera.js";
import AIVisionEvent from "../models/aiVisionEvent.js";
import ConnectionLog from "../models/connectionLog.js";
import Device from "../models/device.js";
import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import {
  buildCameraDashboard,
  buildProtocolIntegrationHealth,
  buildSmartFactoryTwin,
  buildVisionAlertPayload,
  buildVisionOverview,
  buildVisionTimeline,
  normalizeVisionCameraPayload,
  normalizeVisionPayload,
} from "../services/smartFactoryService.js";
import { createAuditLog } from "../services/auditService.js";
import { serializeNotification } from "../services/notificationService.js";
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

export const getVisionCameraDashboard = async (req, res) => {
  try {
    const [cameras, events] = await Promise.all([
      AIVisionCamera.find(buildCompatibleScopedQuery(req))
        .sort({ cameraId: 1 })
        .lean(),
      AIVisionEvent.find(buildCompatibleScopedQuery(req))
        .sort({ observedAt: -1 })
        .limit(500)
        .lean(),
    ]);

    res.json({
      dashboard: buildCameraDashboard({ cameras, events }),
      success: true,
    });
  } catch (error) {
    console.error("AI vision camera dashboard failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to load AI vision camera dashboard",
    });
  }
};

export const upsertVisionCamera = async (req, res) => {
  try {
    const payload = normalizeVisionCameraPayload(req.body, {
      organizationId: req.user?.organizationId,
      plantId: req.tenantContext?.plantId || req.user?.activePlantId,
      tenantId: req.user?.tenantId || req.tenantContext?.tenantId,
    });
    const camera = await AIVisionCamera.findOneAndUpdate(
      { cameraId: payload.cameraId },
      payload,
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );

    await createAuditLog({
      action: "AI_VISION_CAMERA_UPSERTED",
      metadata: { cameraId: camera.cameraId, status: camera.status },
      req,
      resourceId: camera.cameraId,
      resourceType: "ai-vision-camera",
    });

    res.status(201).json({
      camera,
      success: true,
    });
  } catch (error) {
    console.error("AI vision camera upsert failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to save AI vision camera",
    });
  }
};

export const updateVisionCameraStatus = async (req, res) => {
  try {
    const cameraId = String(req.params.cameraId || "").trim();
    const status = String(req.body.status || "").trim();

    if (!cameraId) {
      return res.status(400).json({ message: "cameraId is required" });
    }

    if (!["online", "offline", "degraded", "maintenance"].includes(status)) {
      return res.status(400).json({ message: "Invalid camera status" });
    }

    const camera = await AIVisionCamera.findOneAndUpdate(
      buildCompatibleScopedQuery(req, { cameraId }),
      {
        lastSeenAt: new Date(),
        status,
      },
      { new: true, runValidators: true }
    );

    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }

    await createAuditLog({
      action: "AI_VISION_CAMERA_STATUS_UPDATED",
      metadata: { cameraId, status },
      req,
      resourceId: cameraId,
      resourceType: "ai-vision-camera",
    });

    res.json({
      camera,
      success: true,
    });
  } catch (error) {
    console.error("AI vision camera status update failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to update AI vision camera status",
    });
  }
};

export const getVisionEventTimeline = async (req, res) => {
  try {
    const filters = {};

    for (const field of ["cameraId", "eventType", "severity", "status", "machineId"]) {
      if (req.query[field]) {
        filters[field] = String(req.query[field]);
      }
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const events = await AIVisionEvent.find(buildCompatibleScopedQuery(req, filters))
      .sort({ observedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      timeline: buildVisionTimeline(events),
    });
  } catch (error) {
    console.error("AI vision timeline failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to load AI vision event timeline",
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
    await AIVisionCamera.findOneAndUpdate(
      { cameraId: event.cameraId },
      {
        $addToSet: { enabledDetections: event.eventType },
        $set: {
          lastEventAt: event.observedAt,
          lastSeenAt: new Date(),
          organizationId: event.organizationId,
          plantId: event.plantId,
          status: "online",
          tenantId: event.tenantId,
        },
        $setOnInsert: {
          cameraId: event.cameraId,
          name: event.cameraId,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );

    const alertPayload = buildVisionAlertPayload(event);
    let notification = null;

    if (alertPayload) {
      notification = await Notification.findOneAndUpdate(
        { dedupeKey: alertPayload.dedupeKey },
        {
          $setOnInsert: alertPayload,
        },
        {
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          upsert: true,
        }
      );
    }

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
    if (notification) {
      const serializedNotification = serializeNotification(notification);
      const realtime = req.app.get("machineGateway") || req.app.get("io");
      if (realtime?.broadcastAlert) {
        realtime.broadcastAlert(serializedNotification);
      } else {
        realtime?.emit?.("notification:new", serializedNotification);
      }
    }

    res.status(201).json({
      alert: notification ? serializeNotification(notification) : null,
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

export const updateVisionEventStatus = async (req, res) => {
  try {
    const eventId = String(req.params.eventId || "").trim();
    const status = String(req.body.status || "").trim();

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    if (!["open", "acknowledged", "resolved", "suppressed"].includes(status)) {
      return res.status(400).json({ message: "Invalid vision event status" });
    }

    const event = await AIVisionEvent.findOneAndUpdate(
      buildCompatibleScopedQuery(req, { eventId }),
      {
        status,
        "metadata.statusUpdatedAt": new Date().toISOString(),
        "metadata.statusUpdatedBy": req.user?.email || req.user?.name || "KAVACH",
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "AI vision event not found" });
    }

    await createAuditLog({
      action: "AI_VISION_EVENT_STATUS_UPDATED",
      metadata: { eventId, status },
      req,
      resourceId: eventId,
      resourceType: "ai-vision-event",
    });

    req.app.get("machineGateway")?.emit?.("ai:vision:event:update", event.toObject());

    res.json({
      event,
      success: true,
    });
  } catch (error) {
    console.error("AI vision event status update failed:", error);
    sendErrorResponse(res, error, {
      fallbackMessage: "Failed to update AI vision event status",
    });
  }
};
