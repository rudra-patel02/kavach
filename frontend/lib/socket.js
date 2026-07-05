import { io } from "socket.io-client";
import { getSocketBaseUrl } from "./api";

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
};

const socket = io(getSocketBaseUrl(), {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

if (typeof window !== "undefined") {
  socket.connect();
}

socket.on(SOCKET_EVENTS.HEARTBEAT, (payload) => {
  socket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, payload);
});

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
