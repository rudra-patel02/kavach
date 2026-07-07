import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import { resetDb, startTestDb, stopTestDb } from "./helpers.js";

// A strong device shared-secret used across the auth tests.
const TEST_DEVICE_SECRET = "device-shared-secret-at-least-16-chars";

let Machine;
let Reading;
let Alert;
let health;
let ingest;
let alerts;
let simulator;
let mqttIngest;

let savedDeviceSecret;
let savedSim;

before(async () => {
  await startTestDb();
  Machine = (await import("../models/machine.js")).default;
  Reading = (await import("../models/reading.js")).default;
  Alert = (await import("../models/alert.js")).default;
  health = await import("../services/health.js");
  ingest = await import("../services/ingest.js");
  alerts = await import("../services/alerts.js");
  simulator = await import("../iot/telemetrySimulator.js");
  mqttIngest = await import("../iot/mqttIngest.js");
});

after(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await resetDb();
  savedDeviceSecret = process.env.DEVICE_SECRET;
  savedSim = process.env.ENABLE_SENSOR_SIMULATION;
  process.env.DEVICE_SECRET = TEST_DEVICE_SECRET;
  process.env.ENABLE_SENSOR_SIMULATION = "false";
});

const restoreEnv = () => {
  if (savedDeviceSecret === undefined) delete process.env.DEVICE_SECRET;
  else process.env.DEVICE_SECRET = savedDeviceSecret;
  if (savedSim === undefined) delete process.env.ENABLE_SENSOR_SIMULATION;
  else process.env.ENABLE_SENSOR_SIMULATION = savedSim;
};

const seedMachine = (overrides = {}) =>
  Machine.create({
    machineId: "M001",
    name: "Compressor-01",
    location: "Bay A",
    linkedDeviceId: "DEV-001",
    thresholds: [
      { metric: "temperature", unit: "C", warnMax: 70, critMax: 90 },
      { metric: "oilLevel", unit: "%", warnMin: 40, critMin: 20 },
    ],
    ...overrides,
  });

// ------------------------------------------------------------------ health
describe("Part 2 — health mapping (pure)", () => {
  const machine = {
    thresholds: [
      { metric: "temperature", warnMax: 70, critMax: 90 },
      { metric: "oilLevel", warnMin: 40, critMin: 20 },
    ],
  };

  test("known readings map to the expected status (DoD)", () => {
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 50 }]).status,
      "Running"
    );
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 75 }]).status,
      "Warning"
    );
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 95 }]).status,
      "Critical"
    );
    // one-sided lower-bound metric
    assert.equal(
      health.computeHealth(machine, [{ metric: "oilLevel", value: 30 }]).status,
      "Warning"
    );
    assert.equal(
      health.computeHealth(machine, [{ metric: "oilLevel", value: 10 }]).status,
      "Critical"
    );
  });

  test("healthScore is a deterministic penalty of breaches", () => {
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 50 }]).healthScore,
      100
    );
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 75 }]).healthScore,
      80
    );
    assert.equal(
      health.computeHealth(machine, [{ metric: "temperature", value: 95 }]).healthScore,
      50
    );
    // critical temperature + critical oil → clamped at 0
    const both = health.computeHealth(machine, [
      { metric: "temperature", value: 95 },
      { metric: "oilLevel", value: 10 },
    ]);
    assert.equal(both.healthScore, 0);
    assert.equal(both.status, "Critical");
    assert.equal(both.breaches.length, 2);
  });

  test("uses the latest reading per metric and ignores unknown metrics", () => {
    const result = health.computeHealth(machine, [
      { metric: "temperature", value: 95, ts: new Date("2026-01-01T00:00:00Z") },
      { metric: "temperature", value: 40, ts: new Date("2026-01-01T00:05:00Z") },
      { metric: "humidity", value: 999 }, // no threshold configured → ignored
    ]);
    assert.equal(result.status, "Running");
    assert.equal(result.healthScore, 100);
  });
});

// ------------------------------------------------------ device auth (closed)
describe("Part 2 — device auth fails closed", () => {
  test("verifyDeviceSecret rejects a wrong secret", () => {
    assert.equal(ingest.verifyDeviceSecret("wrong"), false);
    assert.equal(ingest.verifyDeviceSecret(TEST_DEVICE_SECRET), true);
  });

  test("verifyDeviceSecret fails closed when DEVICE_SECRET is unset (no fail-open)", () => {
    delete process.env.DEVICE_SECRET;
    try {
      assert.equal(ingest.verifyDeviceSecret("anything"), false);
      assert.equal(ingest.verifyDeviceSecret(""), false);
    } finally {
      restoreEnv();
    }
  });

  test("ingest rejects an unauthenticated device and persists nothing (DoD)", async () => {
    await seedMachine();

    await assert.rejects(
      () =>
        ingest.ingestTelemetry(
          { machineId: "M001", deviceId: "DEV-001", temperature: 60 },
          { deviceSecret: "wrong" }
        ),
      (err) => err.statusCode === 401
    );

    assert.equal(await Reading.countDocuments({}), 0);
  });

  test("the MQTT handler rejects a payload with a bad secret", async () => {
    await seedMachine();

    await assert.rejects(
      () =>
        mqttIngest.handleMqttMessage(
          "kavach/devices/DEV-001/telemetry",
          JSON.stringify({
            machineId: "M001",
            deviceId: "DEV-001",
            temperature: 60,
            deviceSecret: "nope",
          })
        ),
      (err) => err.statusCode === 401
    );

    assert.equal(await Reading.countDocuments({}), 0);
  });
});

// ------------------------------------------------------------ ingest/readings
describe("Part 2 — ingest stores readings", () => {
  test("a valid reading is stored with correct machine/metric/ts (DoD)", async () => {
    await seedMachine();
    const ts = new Date("2026-07-08T10:00:00Z");

    const result = await ingest.ingestTelemetry(
      { machineId: "M001", deviceId: "DEV-001", timestamp: ts.toISOString(), temperature: 62 },
      { deviceSecret: TEST_DEVICE_SECRET }
    );

    assert.equal(result.source, "device");

    const stored = await Reading.find({ machineId: "M001" }).lean();
    const temp = stored.find((r) => r.metric === "temperature");
    assert.ok(temp, "temperature reading should be stored");
    assert.equal(temp.value, 62);
    assert.equal(temp.machineId, "M001");
    assert.equal(new Date(temp.ts).getTime(), ts.getTime());
    assert.equal(temp.source, "device");

    const machine = await Machine.findOne({ machineId: "M001" }).lean();
    assert.equal(machine.lastReadingSource, "device");
    assert.ok(machine.lastReadingAt, "lastReadingAt should be updated");
  });

  test("a packet with multiple metrics fans out into one reading per metric", async () => {
    await seedMachine();

    await ingest.ingestTelemetry(
      { machineId: "M001", deviceId: "DEV-001", temperature: 60, oilLevel: 80 },
      { deviceSecret: TEST_DEVICE_SECRET }
    );

    assert.equal(await Reading.countDocuments({ machineId: "M001", metric: "temperature" }), 1);
    assert.equal(await Reading.countDocuments({ machineId: "M001", metric: "oilLevel" }), 1);
  });

  test("ingest for an unknown machine is rejected (404)", async () => {
    await assert.rejects(
      () =>
        ingest.ingestTelemetry(
          { machineId: "GHOST", deviceId: "DEV-X", temperature: 60 },
          { deviceSecret: TEST_DEVICE_SECRET }
        ),
      (err) => err.statusCode === 404
    );
  });
});

// -------------------------------------------------------------------- alerts
describe("Part 2 — alerts raise, dedupe, clear, acknowledge", () => {
  const publish = (temperature) =>
    ingest.ingestTelemetry(
      { machineId: "M001", deviceId: "DEV-001", temperature },
      { deviceSecret: TEST_DEVICE_SECRET }
    );

  const activeCount = () =>
    Alert.countDocuments({ machineId: "M001", status: { $in: ["open", "acknowledged"] } });

  test("crossing a threshold creates exactly one Alert (DoD)", async () => {
    await seedMachine();

    await publish(95); // > critMax 90

    const alertDocs = await Alert.find({ machineId: "M001" }).lean();
    assert.equal(alertDocs.length, 1);
    assert.equal(alertDocs[0].metric, "temperature");
    assert.equal(alertDocs[0].severity, "Critical");
    assert.equal(alertDocs[0].breachValue, 95);
    assert.equal(alertDocs[0].status, "open");

    const machine = await Machine.findOne({ machineId: "M001" }).lean();
    assert.equal(machine.status, "Critical");
  });

  test("a second breach within the window does not duplicate the Alert (DoD)", async () => {
    await seedMachine();

    await publish(95);
    await publish(97); // still breaching

    assert.equal(await activeCount(), 1);
    assert.equal(await Alert.countDocuments({ machineId: "M001" }), 1);
  });

  test("returning to normal clears the Alert; a fresh breach opens a new one", async () => {
    await seedMachine();

    await publish(95); // breach → 1 active
    assert.equal(await activeCount(), 1);

    await publish(50); // normal → cleared
    assert.equal(await activeCount(), 0);
    const resolved = await Alert.findOne({ machineId: "M001" }).lean();
    assert.equal(resolved.status, "resolved");
    assert.ok(resolved.resolvedAt);

    await publish(95); // breach again → a brand new alert
    assert.equal(await activeCount(), 1);
    assert.equal(await Alert.countDocuments({ machineId: "M001" }), 2);
  });

  test("acknowledge marks the alert acknowledged but keeps it active", async () => {
    await seedMachine();
    await publish(95);

    const open = await Alert.findOne({ machineId: "M001", status: "open" });
    const acked = await alerts.acknowledgeAlert(open._id, "user-123");

    assert.equal(acked.acknowledged, true);
    assert.equal(acked.status, "acknowledged");
    assert.equal(acked.acknowledgedBy, "user-123");
    assert.ok(acked.acknowledgedAt);
    // still counts as active (not resolved) so a repeat breach won't duplicate
    assert.equal(await activeCount(), 1);

    await publish(96);
    assert.equal(await activeCount(), 1);
    assert.equal(await Alert.countDocuments({ machineId: "M001" }), 1);
  });
});

// ----------------------------------------------------------------- simulator
describe("Part 2 — simulator is opt-in and flagged sim", () => {
  test("a simulated reading is tagged source=sim", () => {
    const machine = { machineId: "M001", linkedDeviceId: "DEV-001" };
    const payload = simulator.generateSimReading(machine);
    assert.equal(payload.source, "sim");
    assert.equal(payload.machineId, "M001");
  });

  test("isSimulatorEnabled reflects the env flag", () => {
    process.env.ENABLE_SENSOR_SIMULATION = "false";
    assert.equal(simulator.isSimulatorEnabled(), false);
    process.env.ENABLE_SENSOR_SIMULATION = "true";
    assert.equal(simulator.isSimulatorEnabled(), true);
    restoreEnv();
  });

  test("with the flag off, sim readings are stored but never counted as live (DoD)", async () => {
    process.env.ENABLE_SENSOR_SIMULATION = "false";
    await seedMachine();

    // A breaching *sim* reading while the flag is off.
    await ingest.ingestTelemetry(
      { machineId: "M001", deviceId: "DEV-001", temperature: 95 },
      { source: "sim", trusted: true }
    );

    // Stored + tagged sim...
    const stored = await Reading.findOne({ machineId: "M001", metric: "temperature" }).lean();
    assert.ok(stored);
    assert.equal(stored.source, "sim");

    // ...but the machine health/status is untouched and no alert was raised.
    const machine = await Machine.findOne({ machineId: "M001" }).lean();
    assert.equal(machine.status, "Running");
    assert.equal(machine.healthScore, 100);
    assert.equal(await Alert.countDocuments({ machineId: "M001" }), 0);

    restoreEnv();
  });

  test("with the flag on, sim readings count as live and drive health/alerts", async () => {
    process.env.ENABLE_SENSOR_SIMULATION = "true";
    await seedMachine();

    await ingest.ingestTelemetry(
      { machineId: "M001", deviceId: "DEV-001", temperature: 95 },
      { source: "sim", trusted: true }
    );

    const machine = await Machine.findOne({ machineId: "M001" }).lean();
    assert.equal(machine.status, "Critical");
    assert.equal(await Alert.countDocuments({ machineId: "M001", status: "open" }), 1);

    restoreEnv();
  });
});
