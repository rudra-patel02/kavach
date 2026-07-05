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
  AI_INSIGHTS: "ai:insights",
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
