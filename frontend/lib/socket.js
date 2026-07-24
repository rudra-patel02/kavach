import { io } from "socket.io-client";

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

let socketInstance = null;

const createSocket = () => {
  const nextSocket = io("", {
    path: "/socket.io",
    transports: ["polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  nextSocket.on(SOCKET_EVENTS.HEARTBEAT, (payload) => {
    nextSocket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, payload);
  });

  nextSocket.connect();

  return nextSocket;
};

const getSocket = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socketInstance) {
    socketInstance = createSocket();
  }

  return socketInstance;
};

const callSocket = (method) => (...args) => {
  const activeSocket = getSocket();
  return activeSocket ? activeSocket[method](...args) : undefined;
};

const socket = {
  connect: callSocket("connect"),
  disconnect: callSocket("disconnect"),
  emit: callSocket("emit"),
  off: callSocket("off"),
  on: callSocket("on"),
};

export const joinPlantRoom = (plantId = "default") => {
  socket.emit(SOCKET_EVENTS.JOIN_PLANT, { plantId });
};

export const leavePlantRoom = (plantId = "default") => {
  socket.emit(SOCKET_EVENTS.LEAVE_PLANT, { plantId });
};

export const joinMachineRoom = (machineId) => {
  if (machineId) {
    socket.emit(SOCKET_EVENTS.JOIN_MACHINE, { machineId });
  }
};

export const leaveMachineRoom = (machineId) => {
  if (machineId) {
    socket.emit(SOCKET_EVENTS.LEAVE_MACHINE, { machineId });
  }
};

export default socket;
