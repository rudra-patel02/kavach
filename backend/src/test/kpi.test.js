import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import bcrypt from "bcryptjs";
import request from "supertest";

import { resetDb, startTestDb, stopTestDb } from "./helpers.js";

let kpi;
let app;
let User;

const HOUR = 3_600_000;
// A fixed window so the math is hand-checkable and deterministic.
const WINDOW_START = new Date("2026-07-01T00:00:00Z").getTime();
const WINDOW_END = WINDOW_START + 10 * HOUR; // 10-hour window

before(async () => {
  await startTestDb();
  kpi = await import("../services/kpi.js");
  app = (await import("../app.js")).createApp();
  User = (await import("../models/user.js")).default;
});

after(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await resetDb();
});

const approx = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≈ ${expected}`);

// ------------------------------------------------------------ pure KPI math
describe("Part 3 — pure KPI math", () => {
  test("OEE equals availability × performance × quality on a known dataset (DoD)", () => {
    // planned 10h, downtime 2h → availability 0.8; run time 8h
    const availability = kpi.computeAvailability({ plannedMs: 10 * HOUR, downtimeMs: 2 * HOUR });
    approx(availability, 0.8);

    // rated 100 units/h over 8h → ideal 800; produced 600 → performance 0.75
    const performance = kpi.computePerformance({
      producedUnits: 600,
      ratedThroughput: 100,
      runTimeMs: 8 * HOUR,
    });
    approx(performance, 0.75);

    // good 480 of 600 → quality 0.8
    const quality = kpi.computeQuality({ goodUnits: 480, totalUnits: 600 });
    approx(quality, 0.8);

    // OEE = 0.8 × 0.75 × 0.8 = 0.48
    approx(kpi.computeOEE(availability, performance, quality), 0.48);
  });

  test("availability never exceeds 100% and never mixes units (DoD)", () => {
    // downtime greater than planned → clamped to 0, not negative
    assert.equal(kpi.computeAvailability({ plannedMs: 1 * HOUR, downtimeMs: 5 * HOUR }), 0);
    // zero downtime → exactly 1 (100%), never above
    assert.equal(kpi.computeAvailability({ plannedMs: 4 * HOUR, downtimeMs: 0 }), 1);
    // a fraction, always within [0,1]
    const a = kpi.computeAvailability({ plannedMs: 8 * HOUR, downtimeMs: 2 * HOUR });
    assert.ok(a >= 0 && a <= 1);
  });

  test("performance and quality are clamped fractions", () => {
    // produced beyond ideal (sensor over-report) never pushes performance > 1
    assert.equal(
      kpi.computePerformance({ producedUnits: 2000, ratedThroughput: 100, runTimeMs: 8 * HOUR }),
      1
    );
    assert.equal(kpi.computeQuality({ goodUnits: 700, totalUnits: 600 }), 1);
  });

  test("MTBF uses real operating time and MTTR averages real repair durations", () => {
    // 8h operating, 2 failures → MTBF 4h
    approx(kpi.computeMTBF({ operatingMs: 8 * HOUR, failures: 2 }), 4);
    // repairs of 1h and 3h → MTTR 2h
    approx(
      kpi.computeMTTR([
        { startMs: 0, endMs: 1 * HOUR },
        { startMs: 0, endMs: 3 * HOUR },
      ]),
      2
    );
  });

  test("empty window returns zeros, not NaN (DoD)", () => {
    for (const value of [
      kpi.computeAvailability({ plannedMs: 0, downtimeMs: 0 }),
      kpi.computePerformance({ producedUnits: 0, ratedThroughput: 0, runTimeMs: 0 }),
      kpi.computeQuality({ goodUnits: 0, totalUnits: 0 }),
      kpi.computeMTBF({ operatingMs: 0, failures: 0 }),
      kpi.computeMTTR([]),
      kpi.computeOEE(0, 0, 0),
    ]) {
      assert.ok(Number.isFinite(value), `${value} should be finite`);
      assert.equal(value, 0);
    }
  });
});

// ----------------------------------------------------- machine orchestrator
describe("Part 3 — per-machine KPIs from readings/alerts", () => {
  const buildReadings = (metric, values, source = "device") =>
    values.map((value, i) => ({
      machineId: "M001",
      metric,
      value,
      source,
      ts: new Date(WINDOW_START + (i + 1) * HOUR),
    }));

  test("derives OEE/MTBF/MTTR for a machine over a fixed window (DoD hand-check)", () => {
    const machine = { machineId: "M001", status: "Running", ratedThroughput: 100 };

    // 6 production reports of 100/80 → produced 600, good 480
    const readings = [
      ...buildReadings("unitsTotal", [100, 100, 100, 100, 100, 100]),
      ...buildReadings("unitsGood", [80, 80, 80, 80, 80, 80]),
    ];

    // one Critical failure: down from +3h to +5h (2h downtime, resolved)
    const alerts = [
      {
        machineId: "M001",
        metric: "temperature",
        severity: "Critical",
        status: "resolved",
        breachValue: 99,
        ts: new Date(WINDOW_START + 3 * HOUR),
        resolvedAt: new Date(WINDOW_START + 5 * HOUR),
      },
    ];

    const result = kpi.computeMachineKPIs(machine, {
      readings,
      alerts,
      windowStart: WINDOW_START,
      windowEnd: WINDOW_END,
    });

    approx(result.availability, 0.8); // (10-2)/10
    approx(result.performance, 0.75); // 600 / (100 * 8h)
    approx(result.quality, 0.8); // 480/600
    approx(result.oee, 0.48);
    approx(result.mtbfHours, 8); // 8h operating / 1 failure
    approx(result.mttrHours, 2); // one 2h repair
    assert.equal(result.failures, 1);
    assert.equal(result.dataComplete, true);
  });

  test("MTBF counts each failure once: Critical status AND a Critical alert = one failure (DoD)", () => {
    const machine = { machineId: "M001", status: "Critical", ratedThroughput: 0 };
    const alerts = [
      {
        machineId: "M001",
        metric: "temperature",
        severity: "Critical",
        status: "open",
        breachValue: 99,
        ts: new Date(WINDOW_START + 2 * HOUR),
      },
    ];

    const result = kpi.computeMachineKPIs(machine, {
      readings: [],
      alerts,
      windowStart: WINDOW_START,
      windowEnd: WINDOW_END,
    });

    assert.equal(result.failures, 1);
  });

  test("no production data → OEE is flagged incomplete rather than fabricated", () => {
    const machine = { machineId: "M001", status: "Running", ratedThroughput: 0 };
    const result = kpi.computeMachineKPIs(machine, {
      readings: [],
      alerts: [],
      windowStart: WINDOW_START,
      windowEnd: WINDOW_END,
    });

    assert.equal(result.dataComplete, false);
    assert.equal(result.oee, null);
    // availability is still real (no downtime → 1)
    approx(result.availability, 1);
    assert.ok(Number.isFinite(result.mtbfHours));
    assert.ok(Number.isFinite(result.mttrHours));
  });

  test("only device (live) readings feed production KPIs; sim readings are ignored", () => {
    const machine = { machineId: "M001", status: "Running", ratedThroughput: 100 };
    const readings = [
      ...buildReadings("unitsTotal", [100, 100, 100, 100, 100, 100], "device"), // 600
      ...buildReadings("unitsTotal", [500], "sim"), // must NOT be counted
      ...buildReadings("unitsGood", [80, 80, 80, 80, 80, 80], "device"), // 480
    ];
    const result = kpi.computeMachineKPIs(machine, {
      readings,
      alerts: [],
      windowStart: WINDOW_START,
      windowEnd: WINDOW_END,
    });
    assert.equal(result.producedUnits, 600);
    assert.equal(result.goodUnits, 480);
  });
});

// -------------------------------------------------------------- plant + API
describe("Part 3 — plant rollup + endpoint auth", () => {
  test("plant rollup over an empty window returns zeros, not NaN", () => {
    const plant = kpi.computePlantKPIs([], {
      readings: [],
      alerts: [],
      windowStart: WINDOW_START,
      windowEnd: WINDOW_START, // empty window
    });
    for (const v of [plant.availability, plant.mtbfHours, plant.mttrHours]) {
      assert.ok(Number.isFinite(v));
    }
    assert.equal(plant.machineCount, 0);
  });

  const seedUser = async (role, email) =>
    User.create({ name: role, email, password: await bcrypt.hash("password123", 10), role });

  const loginToken = async (email) => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });
    return res.body.token;
  };

  test("the KPI endpoint requires auth (DoD)", async () => {
    const res = await request(app).get("/api/kpis");
    assert.equal(res.status, 401);
  });

  test("an authenticated user gets plant + per-machine KPIs scoped to the caller", async () => {
    await seedUser("Viewer", "viewer@example.com");
    const token = await loginToken("viewer@example.com");

    const res = await request(app).get("/api/kpis").set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.plant, "expected a plant rollup");
    assert.ok(Array.isArray(res.body.machines), "expected a per-machine array");
    assert.ok(Number.isFinite(res.body.plant.availability));
  });
});
