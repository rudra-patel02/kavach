import {
  DEFAULT_PLANT_ID,
  SOCKET_EVENTS,
  getMachineRoom,
  getPlantRoom,
  normalizeRoomId,
} from "./events.js";

const getMachineKey = (machine) =>
  machine?.machineId || machine?._id || machine?.id || "unknown";

const normalizeMachine = (machine) =>
  machine && typeof machine.toObject === "function" ? machine.toObject() : machine;

const emitToMachineRoom = (io, machineId, event, payload) => {
  if (machineId) {
    io.to(getMachineRoom(machineId)).emit(event, payload);
  }
};

export const createMachineGateway = (io) => {
  const emit = (event, payload) => {
    io.emit(event, payload);
  };

  const emitPlant = (plantId, event, payload) => {
    io.to(getPlantRoom(plantId)).emit(event, payload);
  };

  return {
    io,

    emit,

    emitPlant,

    broadcastHeartbeat(plantId = DEFAULT_PLANT_ID) {
      const payload = {
        plantId: normalizeRoomId(plantId),
        timestamp: new Date().toISOString(),
      };

      emit(SOCKET_EVENTS.HEARTBEAT, payload);
      return payload;
    },

    broadcastMachineSnapshot(
      machines,
      { plantId = DEFAULT_PLANT_ID, predictiveOverview, aiInsights } = {}
    ) {
      const normalizedMachines = (Array.isArray(machines) ? machines : [machines])
        .filter(Boolean)
        .map(normalizeMachine);
      const payload = {
        plantId: normalizeRoomId(plantId),
        generatedAt: new Date().toISOString(),
        machines: normalizedMachines,
      };

      emit(SOCKET_EVENTS.LEGACY_MACHINE_UPDATE, normalizedMachines);
      emit(SOCKET_EVENTS.MACHINES_UPDATE, payload);
      emitPlant(plantId, SOCKET_EVENTS.MACHINES_UPDATE, payload);

      for (const machine of normalizedMachines) {
        const machineId = getMachineKey(machine);
        const machinePayload = {
          plantId: payload.plantId,
          generatedAt: payload.generatedAt,
          machine,
        };

        emitToMachineRoom(io, machineId, SOCKET_EVENTS.MACHINE_UPDATE, machinePayload);
      }

      if (predictiveOverview) {
        emit(SOCKET_EVENTS.PREDICTIVE_OVERVIEW, predictiveOverview);
        emitPlant(plantId, SOCKET_EVENTS.PREDICTIVE_OVERVIEW, predictiveOverview);
      }

      if (aiInsights) {
        emit(SOCKET_EVENTS.AI_INSIGHTS, aiInsights);
        emitPlant(plantId, SOCKET_EVENTS.AI_INSIGHTS, aiInsights);
      }

      return payload;
    },

    broadcastAlert(notification, { plantId = DEFAULT_PLANT_ID } = {}) {
      const payload = {
        plantId: normalizeRoomId(plantId),
        generatedAt: new Date().toISOString(),
        notification,
      };

      emit(SOCKET_EVENTS.LEGACY_NOTIFICATION_CREATED, notification);
      emit(SOCKET_EVENTS.NOTIFICATION_CREATED, payload);
      emit(SOCKET_EVENTS.ALERT_CREATED, payload);
      emitPlant(plantId, SOCKET_EVENTS.NOTIFICATION_CREATED, payload);
      emitPlant(plantId, SOCKET_EVENTS.ALERT_CREATED, payload);
      emitToMachineRoom(
        io,
        notification?.machineId,
        SOCKET_EVENTS.ALERT_CREATED,
        payload
      );

      return payload;
    },

    broadcastNotificationRead(payload) {
      emit(SOCKET_EVENTS.NOTIFICATION_READ, payload);
    },

    broadcastAllNotificationsRead(payload) {
      emit(SOCKET_EVENTS.NOTIFICATIONS_READ_ALL, payload);
    },

    broadcastNotificationDeleted(payload) {
      emit(SOCKET_EVENTS.NOTIFICATION_DELETED, payload);
    },

    broadcastNotificationsCleared() {
      emit(SOCKET_EVENTS.NOTIFICATIONS_CLEARED);
    },

    broadcastWorkOrderCreated(workOrder) {
      emit(SOCKET_EVENTS.WORKORDER_CREATED, workOrder);
    },

    broadcastWorkOrderUpdated(workOrder) {
      emit(SOCKET_EVENTS.WORKORDER_UPDATED, workOrder);
    },

    broadcastWorkOrderDeleted(payload) {
      emit(SOCKET_EVENTS.WORKORDER_DELETED, payload);
    },
  };
};
