import { Server } from "socket.io";

import {
  DEFAULT_PLANT_ID,
  SOCKET_EVENTS,
  getMachineRoom,
  getPlantRoom,
  normalizeRoomId,
} from "./events.js";
import { createMachineGateway } from "./machineGateway.js";

const SOCKET_HEARTBEAT_MS = 25000;

export const createSocketServer = (server, corsOptions) => {
  const io = new Server(server, {
    cors: corsOptions,
    pingInterval: SOCKET_HEARTBEAT_MS,
    pingTimeout: 30000,
    transports: ["websocket", "polling"],
  });
  const gateway = createMachineGateway(io);

  io.on("connection", (socket) => {
    socket.join(getPlantRoom(DEFAULT_PLANT_ID));
    socket.emit(SOCKET_EVENTS.HELLO, {
      message: "Socket Working",
      socketId: socket.id,
      rooms: [getPlantRoom(DEFAULT_PLANT_ID)],
    });

    socket.on(SOCKET_EVENTS.JOIN_PLANT, (payload = {}) => {
      const plantId = normalizeRoomId(payload.plantId || payload);
      socket.join(getPlantRoom(plantId));
      socket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, {
        plantId,
        joined: true,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on(SOCKET_EVENTS.LEAVE_PLANT, (payload = {}) => {
      const plantId = normalizeRoomId(payload.plantId || payload);
      socket.leave(getPlantRoom(plantId));
    });

    socket.on(SOCKET_EVENTS.JOIN_MACHINE, (payload = {}) => {
      const machineId = normalizeRoomId(payload.machineId || payload, "");

      if (machineId) {
        socket.join(getMachineRoom(machineId));
        socket.emit(SOCKET_EVENTS.HEARTBEAT_ACK, {
          machineId,
          joined: true,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_MACHINE, (payload = {}) => {
      const machineId = normalizeRoomId(payload.machineId || payload, "");

      if (machineId) {
        socket.leave(getMachineRoom(machineId));
      }
    });

    socket.on(SOCKET_EVENTS.HEARTBEAT_ACK, () => {
      socket.data.lastHeartbeatAck = Date.now();
    });
  });

  const heartbeatTimer = setInterval(() => {
    gateway.broadcastHeartbeat(DEFAULT_PLANT_ID);
  }, SOCKET_HEARTBEAT_MS);

  heartbeatTimer.unref?.();

  const close = (callback) => {
    clearInterval(heartbeatTimer);
    io.close(callback);
  };

  return {
    io,
    gateway,
    close,
  };
};
