import assert from "node:assert/strict";
import test from "node:test";

import { SOCKET_EVENTS, getMachineRoom, getPlantRoom } from "../src/socket/events.js";
import { createMachineGateway } from "../src/socket/machineGateway.js";

const createFakeIo = () => {
  const calls = [];

  return {
    calls,
    emit(event, payload) {
      calls.push({ event, payload });
    },
    to(room) {
      return {
        emit(event, payload) {
          calls.push({ room, event, payload });
        },
      };
    },
  };
};

test("builds stable plant and machine room names", () => {
  assert.equal(getPlantRoom("west"), "plant:west");
  assert.equal(getMachineRoom("M001"), "machine:M001");
});

test("broadcasts machine snapshots to legacy, plant, and machine channels", () => {
  const io = createFakeIo();
  const gateway = createMachineGateway(io);
  const predictiveOverview = { summary: { totalMachines: 1 } };

  gateway.broadcastMachineSnapshot(
    [{ machineId: "M001", name: "Pump", health: 88 }],
    {
      plantId: "west",
      predictiveOverview,
      aiInsights: { insights: [] },
    }
  );

  assert.ok(
    io.calls.some((call) => call.event === SOCKET_EVENTS.LEGACY_MACHINE_UPDATE)
  );
  assert.ok(
    io.calls.some(
      (call) =>
        call.room === getPlantRoom("west") &&
        call.event === SOCKET_EVENTS.MACHINES_UPDATE
    )
  );
  assert.ok(
    io.calls.some(
      (call) =>
        call.room === getMachineRoom("M001") &&
        call.event === SOCKET_EVENTS.MACHINE_UPDATE
    )
  );
  assert.ok(
    io.calls.some((call) => call.event === SOCKET_EVENTS.PREDICTIVE_OVERVIEW)
  );
  assert.ok(
    io.calls.some((call) => call.event === SOCKET_EVENTS.ENTERPRISE_REFRESH)
  );
});

test("broadcasts alerts across notification and alert event channels", () => {
  const io = createFakeIo();
  const gateway = createMachineGateway(io);

  gateway.broadcastAlert(
    {
      id: "N001",
      machineId: "M001",
      title: "Pressure anomaly",
    },
    { plantId: "west" }
  );

  assert.ok(
    io.calls.some(
      (call) => call.event === SOCKET_EVENTS.LEGACY_NOTIFICATION_CREATED
    )
  );
  assert.ok(io.calls.some((call) => call.event === SOCKET_EVENTS.ALERT_CREATED));
  assert.ok(
    io.calls.some(
      (call) =>
        call.room === getMachineRoom("M001") &&
        call.event === SOCKET_EVENTS.ALERT_CREATED
    )
  );
});

test("broadcasts enterprise refresh and maintenance status updates", () => {
  const io = createFakeIo();
  const gateway = createMachineGateway(io);

  gateway.broadcastEnterpriseRefresh({ reason: "test" }, { plantId: "west" });
  gateway.broadcastWorkOrderUpdated({
    workOrderId: "WO-1",
    status: "IN_PROGRESS",
  });

  assert.ok(
    io.calls.some((call) => call.event === SOCKET_EVENTS.ENTERPRISE_REFRESH)
  );
  assert.ok(
    io.calls.some(
      (call) =>
        call.room === getPlantRoom("west") &&
        call.event === SOCKET_EVENTS.FLEET_HEALTH_UPDATE
    )
  );
  assert.ok(
    io.calls.some(
      (call) => call.event === SOCKET_EVENTS.MAINTENANCE_STATUS_UPDATE
    )
  );
});
