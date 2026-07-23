export const SOCKET_EVENTS = {
  HELLO: "hello",
  HEARTBEAT: "plant:heartbeat",
  HEARTBEAT_ACK: "plant:heartbeat:ack",
  JOIN_PLANT: "plant:join",
  LEAVE_PLANT: "plant:leave",
  JOIN_MACHINE: "machine:join",
  LEAVE_MACHINE: "machine:leave",
  MACHINES_UPDATE: "machines:update",
  MACHINE_UPDATE: "machine:update",
  LEGACY_MACHINE_UPDATE: "machineUpdate",
  PREDICTIVE_OVERVIEW: "predictive:overview",
  PREDICTION_UPDATE: "prediction:update",
  AI_INSIGHTS: "ai:insights",
  AI_INTELLIGENCE_UPDATE: "ai:intelligence:update",
  AI_ANOMALY: "ai:anomaly",
  AI_FORECAST_UPDATE: "ai:forecast:update",
  AI_MAINTENANCE_PLAN: "ai:maintenance-plan:update",
  TELEMETRY_UPDATE: "telemetry:update",
  DEVICE_ONLINE: "device:online",
  DEVICE_OFFLINE: "device:offline",
  DEVICE_HEARTBEAT: "device:heartbeat",
  SENSOR_UPDATE: "sensor-update",
  SENSOR_ALERT: "sensor:alert",
  ALERT_CREATED: "alert:created",
  NOTIFICATION_CREATED: "notification:created",
  LEGACY_NOTIFICATION_CREATED: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATIONS_READ_ALL: "notifications:readAll",
  NOTIFICATION_DELETED: "notification:deleted",
  NOTIFICATIONS_CLEARED: "notifications:cleared",
  WORKORDER_CREATED: "workorder:new",
  WORKORDER_UPDATED: "workorder:updated",
  WORKORDER_DELETED: "workorder:deleted",
  ENTERPRISE_REFRESH: "enterprise:dashboard:refresh",
  FLEET_HEALTH_UPDATE: "enterprise:fleet:update",
  MAINTENANCE_STATUS_UPDATE: "enterprise:maintenance:update",
};

export const DEFAULT_PLANT_ID = "default";
export const PLANT_ROOM_PREFIX = "plant:";
export const MACHINE_ROOM_PREFIX = "machine:";

export const normalizeRoomId = (value, fallback = DEFAULT_PLANT_ID) => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

export const getPlantRoom = (plantId = DEFAULT_PLANT_ID) =>
  `${PLANT_ROOM_PREFIX}${normalizeRoomId(plantId)}`;

export const getMachineRoom = (machineId) =>
  `${MACHINE_ROOM_PREFIX}${normalizeRoomId(machineId, "unknown")}`;
