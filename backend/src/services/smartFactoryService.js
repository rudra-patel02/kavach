import { createMachinePrediction } from "./predictionService.js";

const PROTOCOLS = ["MQTT", "OPC_UA", "MODBUS_TCP", "MODBUS_RTU", "PLC", "REST"];
const VISION_TYPES = ["PPE", "FIRE", "SMOKE", "INTRUSION"];
const VISION_ALERT_TYPES = new Set(["PPE", "FIRE", "SMOKE", "INTRUSION"]);

const round = (value, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : 0;
};

const average = (values) => {
  const numericValues = values.filter((value) => Number.isFinite(Number(value)));
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + Number(value), 0) / numericValues.length;
};

const getSeverityRank = (severity) =>
  ({ Low: 1, Medium: 2, High: 3, Critical: 4 })[severity] || 1;

const getProtocolName = (device) => {
  const rawProtocol = String(
    device.protocol || device.metadata?.protocol || "REST"
  ).toUpperCase();
  if (rawProtocol === "MODBUS") return "MODBUS_TCP";
  if (rawProtocol === "PLC") return "PLC";
  return PROTOCOLS.includes(rawProtocol) ? rawProtocol : "REST";
};

export const buildProtocolIntegrationHealth = ({
  devices = [],
  connectionLogs = [],
} = {}) => {
  const protocols = PROTOCOLS.map((protocol) => {
    const protocolDevices = devices.filter(
      (device) => getProtocolName(device) === protocol
    );
    const online = protocolDevices.filter(
      (device) => device.connectionStatus === "online"
    ).length;
    const warning = protocolDevices.filter((device) =>
      ["warning", "critical"].includes(device.healthStatus)
    ).length;
    const recentErrors = connectionLogs.filter(
      (log) =>
        getProtocolName(log) === protocol &&
        ["error", "offline", "failed"].includes(String(log.status || log.event).toLowerCase())
    ).length;
    const availability =
      protocolDevices.length > 0 ? round((online / protocolDevices.length) * 100, 1) : 100;

    return {
      protocol,
      displayName: protocol.replace(/_/g, " "),
      devices: protocolDevices.length,
      online,
      offline: protocolDevices.length - online,
      warning,
      recentErrors,
      availability,
      status:
        recentErrors > 5 || availability < 80
          ? "degraded"
          : warning > 0 || availability < 95
            ? "watch"
            : "healthy",
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    protocols,
    summary: {
      adaptersReady: protocols.length,
      connectedDevices: protocols.reduce((total, protocol) => total + protocol.online, 0),
      degradedProtocols: protocols.filter((protocol) => protocol.status === "degraded").length,
      enterpriseReadiness: round(average(protocols.map((protocol) => protocol.availability)), 1),
    },
  };
};

export const normalizeVisionPayload = (payload = {}, context = {}) => {
  const cameraId = String(payload.cameraId || "").trim();
  if (!cameraId) {
    const error = new Error("cameraId is required");
    error.statusCode = 400;
    throw error;
  }

  const eventType = String(payload.eventType || "UNKNOWN").toUpperCase();
  const detections = Array.isArray(payload.detections) ? payload.detections : [];
  const severity = String(payload.severity || "").trim();
  const inferredSeverity =
    severity ||
    detections
      .map((detection) => detection?.severity)
      .filter(Boolean)
      .sort((a, b) => getSeverityRank(b) - getSeverityRank(a))[0] ||
    (["FIRE", "SMOKE", "INTRUSION"].includes(eventType) ? "High" : "Medium");

  return {
    eventId:
      String(payload.eventId || "").trim() ||
      `VISION-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    tenantId: payload.tenantId || context.tenantId || "",
    organizationId: payload.organizationId || context.organizationId || "",
    plantId: payload.plantId || context.plantId || "",
    areaId: payload.areaId || "",
    cameraId,
    machineId: payload.machineId || "",
    eventType: VISION_TYPES.includes(eventType) ? eventType : "UNKNOWN",
    severity: ["Low", "Medium", "High", "Critical"].includes(inferredSeverity)
      ? inferredSeverity
      : "Medium",
    detections: detections.map((detection) => ({
      label: String(detection?.label || eventType || "UNKNOWN"),
      confidence: round(Math.min(100, Math.max(0, Number(detection?.confidence || 0))), 1),
      severity: ["Low", "Medium", "High", "Critical"].includes(detection?.severity)
        ? detection.severity
        : inferredSeverity,
      boundingBox: detection?.boundingBox || {},
    })),
    snapshotUrl: payload.snapshotUrl || "",
    source: payload.source || "edge-ai",
    observedAt: payload.observedAt ? new Date(payload.observedAt) : new Date(),
    metadata: payload.metadata || {},
  };
};

export const normalizeVisionCameraPayload = (payload = {}, context = {}) => {
  const cameraId = String(payload.cameraId || "").trim();
  const name = String(payload.name || cameraId || "").trim();

  if (!cameraId) {
    const error = new Error("cameraId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!name) {
    const error = new Error("name is required");
    error.statusCode = 400;
    throw error;
  }

  const enabledDetections = Array.isArray(payload.enabledDetections)
    ? payload.enabledDetections
        .map((item) => String(item).toUpperCase())
        .filter((item) => VISION_TYPES.includes(item))
    : VISION_TYPES;

  return {
    areaId: payload.areaId || "",
    cameraId,
    confidenceThreshold: Math.min(
      100,
      Math.max(0, Number(payload.confidenceThreshold ?? 70))
    ),
    enabledDetections: enabledDetections.length ? enabledDetections : VISION_TYPES,
    lastSeenAt: payload.lastSeenAt ? new Date(payload.lastSeenAt) : new Date(),
    location: payload.location || "",
    machineId: payload.machineId || "",
    metadata: payload.metadata || {},
    name,
    organizationId: payload.organizationId || context.organizationId || "",
    plantId: payload.plantId || context.plantId || "",
    status: ["online", "offline", "degraded", "maintenance"].includes(payload.status)
      ? payload.status
      : "online",
    streamUrl: payload.streamUrl || "",
    tenantId: payload.tenantId || context.tenantId || "",
  };
};

export const buildVisionOverview = (events = []) => {
  const openEvents = events.filter((event) => event.status !== "resolved");
  const byType = VISION_TYPES.reduce((acc, type) => {
    acc[type] = events.filter((event) => event.eventType === type).length;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvents: events.length,
      openEvents: openEvents.length,
      criticalEvents: events.filter((event) => event.severity === "Critical").length,
      monitoredUseCases: VISION_TYPES,
    },
    byType,
    latestEvents: events.slice(0, 25).map((event) => ({
      eventId: event.eventId,
      cameraId: event.cameraId,
      machineId: event.machineId,
      plantId: event.plantId,
      eventType: event.eventType,
      severity: event.severity,
      status: event.status,
      snapshotUrl: event.snapshotUrl,
      observedAt: event.observedAt ? new Date(event.observedAt).toISOString() : null,
    })),
  };
};

export const buildVisionTimeline = (events = []) =>
  events.map((event) => ({
    areaId: event.areaId || "",
    cameraId: event.cameraId,
    detections: event.detections || [],
    eventId: event.eventId,
    eventType: event.eventType,
    machineId: event.machineId || "",
    observedAt: event.observedAt ? new Date(event.observedAt).toISOString() : null,
    severity: event.severity,
    snapshotUrl: event.snapshotUrl || "",
    status: event.status || "open",
    title: `${event.eventType} ${event.severity} event`,
  }));

export const buildCameraDashboard = ({ cameras = [], events = [] } = {}) => {
  const now = Date.now();
  const camerasWithStats = cameras.map((camera) => {
    const cameraEvents = events.filter((event) => event.cameraId === camera.cameraId);
    const latestEvent = cameraEvents[0] || null;
    const lastSeen = camera.lastSeenAt || camera.lastEventAt || latestEvent?.observedAt;
    const minutesSinceSeen = lastSeen
      ? Math.round((now - new Date(lastSeen).getTime()) / 60000)
      : null;

    return {
      areaId: camera.areaId || "",
      cameraId: camera.cameraId,
      enabledDetections: camera.enabledDetections || VISION_TYPES,
      eventCounts: VISION_TYPES.reduce((acc, type) => {
        acc[type] = cameraEvents.filter((event) => event.eventType === type).length;
        return acc;
      }, {}),
      highSeverityEvents: cameraEvents.filter((event) =>
        ["High", "Critical"].includes(event.severity)
      ).length,
      lastEventAt: latestEvent?.observedAt
        ? new Date(latestEvent.observedAt).toISOString()
        : null,
      lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : null,
      location: camera.location || "",
      machineId: camera.machineId || "",
      name: camera.name,
      status: camera.status || "online",
      streamUrl: camera.streamUrl || "",
      stale: minutesSinceSeen !== null && minutesSinceSeen > 15,
      totalEvents: cameraEvents.length,
    };
  });

  return {
    cameras: camerasWithStats,
    generatedAt: new Date().toISOString(),
    summary: {
      cameras: cameras.length,
      degradedCameras: camerasWithStats.filter((camera) =>
        ["degraded", "offline"].includes(camera.status) || camera.stale
      ).length,
      onlineCameras: camerasWithStats.filter((camera) => camera.status === "online").length,
      totalEvents: events.length,
    },
  };
};

export const buildVisionAlertPayload = (event) => {
  if (!event || !VISION_ALERT_TYPES.has(event.eventType)) {
    return null;
  }

  const priority =
    event.severity === "Critical" ? "P1" : event.severity === "High" ? "P2" : "P3";
  const actionByType = {
    FIRE: "Trigger emergency response, isolate the affected area, and verify fire suppression.",
    INTRUSION: "Dispatch security and verify access control logs for the camera zone.",
    PPE: "Notify the area supervisor and verify PPE compliance before work continues.",
    SMOKE: "Inspect the area immediately and verify ventilation and fire sensors.",
  };

  return {
    category: "safety_warning",
    channels: ["push", "email"],
    dedupeKey: `vision:${event.eventId}`,
    description: `${event.eventType} detection from camera ${event.cameraId}`,
    icon: "bell",
    machineId: event.machineId || "",
    machineName: event.machineId || "Camera zone",
    message: `${event.eventType} detected by ${event.cameraId} with ${event.severity} severity.`,
    organizationId: event.organizationId || "",
    plantId: event.plantId || "",
    priority,
    severity: event.severity || "Medium",
    suggestedAction: actionByType[event.eventType] || "Review AI vision event timeline.",
    tenantId: event.tenantId || "",
    title: `AI Vision ${event.eventType} Alert`,
    type: "safety_warning",
    alertTimeline: [
      {
        actor: "KAVACH AI Vision",
        event: "AI_VISION_EVENT_DETECTED",
        message: `${event.eventType} event ${event.eventId} detected on camera ${event.cameraId}.`,
      },
    ],
    alertHistory: [
      {
        actor: "KAVACH AI Vision",
        event: "AI_VISION_EVENT_DETECTED",
        message: `${event.eventType} event ${event.eventId} detected on camera ${event.cameraId}.`,
      },
    ],
  };
};

export const buildWhatIfSimulation = (machine, scenario = {}) => {
  const baseline = createMachinePrediction(machine);
  const overrides = scenario.overrides && typeof scenario.overrides === "object"
    ? scenario.overrides
    : {};
  const simulatedMachine = {
    ...machine,
    ...Object.entries(overrides).reduce((acc, [key, value]) => {
      const number = Number(value);
      acc[key] = Number.isFinite(number) ? number : value;
      return acc;
    }, {}),
  };
  const simulated = createMachinePrediction(simulatedMachine);
  const riskDelta = round(simulated.failureProbability - baseline.failureProbability, 1);
  const rulDelta = Math.round(
    simulated.remainingUsefulLifeHours - baseline.remainingUsefulLifeHours
  );
  const downtimeDeltaHours = round(
    simulated.estimatedDowntimeHours - baseline.estimatedDowntimeHours,
    1
  );
  const downtimeCostPerHour = Number(process.env.DOWNTIME_COST_PER_HOUR || 5000);
  const financialImpact = Math.max(
    0,
    Math.round((simulated.estimatedDowntimeHours + Math.max(0, riskDelta) / 10) * downtimeCostPerHour)
  );
  const scenarioName = String(scenario.name || "What-if scenario");
  const operationalImpact =
    riskDelta > 15
      ? "Severe disruption likely; controlled slowdown or maintenance window is recommended before this condition persists."
      : riskDelta > 5
        ? "Moderate operational degradation expected; monitor adjacent production cells and prepare maintenance coverage."
        : riskDelta < -5
          ? "Operational risk improves against the current baseline with lower expected maintenance exposure."
          : "Limited operational variance from the current baseline; continue monitoring live telemetry.";
  const recommendedActions = [
    simulated.recommendedAction || simulated.recommendation,
    simulated.riskLevel === "Critical"
      ? "Escalate to plant leadership and open a controlled maintenance window."
      : "Keep the recommendation in supervisor review and continue live telemetry validation.",
    riskDelta > 5
      ? "Notify affected production, quality, and maintenance teams before proceeding."
      : "Record the scenario outcome for future shift handover context.",
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    scenario: {
      name: scenarioName,
      eventType: String(scenario.eventType || scenario.type || "custom"),
      overrides,
      assumptions: [
        "Simulation uses the current Kavach deterministic risk model.",
        "No machine state is persisted by this endpoint.",
        "Financial impact uses the configured downtime cost per hour.",
      ],
    },
    machine: {
      machineId: machine.machineId,
      name: machine.name,
      status: machine.status,
    },
    baseline,
    simulated,
    impact: {
      riskDelta,
      remainingUsefulLifeHoursDelta: rulDelta,
      downtimeDeltaHours,
      affectedMachines: [
        {
          machineId: machine.machineId,
          name: machine.name,
          department: machine.department || "Production",
          riskLevel: simulated.riskLevel,
        },
      ],
      downtimeHours: simulated.estimatedDowntimeHours,
      financialImpact,
      operationalImpact,
      riskLevel: simulated.riskLevel,
      recommendedActions,
      recommendation:
        riskDelta > 10
          ? "Scenario increases operational risk; reduce load or schedule maintenance before applying."
          : riskDelta < -10
            ? "Scenario improves expected reliability and can be considered for controlled rollout."
            : "Scenario has limited risk impact; monitor closely after rollout.",
    },
  };
};

export const buildSmartFactoryTwin = ({
  machines = [],
  devices = [],
  notifications = [],
  visionEvents = [],
} = {}) => {
  const machineNodes = machines.map((machine, index) => {
    const linkedDevices = devices.filter(
      (device) =>
        device.machineId === machine.machineId ||
        device.deviceId === machine.linkedDeviceId
    );
    const prediction = createMachinePrediction(machine);

    return {
      id: machine.machineId,
      label: machine.name,
      type: "machine",
      position: {
        x: (index % 6) * 18,
        y: Math.floor(index / 6) * 14,
        z: 0,
      },
      state: {
        status: machine.status,
        health: round(machine.health, 1),
        riskLevel: prediction.riskLevel,
        failureProbability: prediction.failureProbability,
        remainingUsefulLifeHours: prediction.remainingUsefulLifeHours,
        liveTelemetryEnabled: Boolean(machine.liveTelemetryEnabled),
      },
      telemetry: prediction.telemetry,
      devices: linkedDevices.map((device) => device.deviceId),
    };
  });

  const deviceNodes = devices.map((device, index) => ({
    id: device.deviceId,
    label: device.deviceType,
    type: "device",
    parentMachineId: device.machineId,
    position: {
      x: (index % 6) * 18 + 6,
      y: Math.floor(index / 6) * 14 + 5,
      z: 4,
    },
    state: {
      protocol: getProtocolName(device),
      connectionStatus: device.connectionStatus,
      healthStatus: device.healthStatus,
      lastSeen: device.lastSeen ? new Date(device.lastSeen).toISOString() : null,
    },
  }));

  return {
    generatedAt: new Date().toISOString(),
    version: "4.0",
    nodes: [...machineNodes, ...deviceNodes],
    alerts: notifications.slice(0, 50).map((notification) => ({
      id: String(notification._id || notification.id || notification.notificationId),
      machineId: notification.machineId,
      severity: notification.severity || notification.priority || "Low",
      title: notification.title || notification.message || "Machine alert",
      createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : null,
    })),
    vision: buildVisionOverview(visionEvents),
    summary: {
      machines: machines.length,
      devices: devices.length,
      onlineDevices: devices.filter((device) => device.connectionStatus === "online").length,
      averageHealth: round(average(machines.map((machine) => machine.health)), 1),
      highRiskMachines: machineNodes.filter((node) =>
        ["High", "Critical"].includes(node.state.riskLevel)
      ).length,
    },
  };
};
