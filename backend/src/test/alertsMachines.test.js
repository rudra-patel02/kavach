import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import bcrypt from "bcryptjs";
import request from "supertest";

import { resetDb, startTestDb, stopTestDb } from "./helpers.js";

let app;
let User;
let Machine;
let Reading;
let Alert;

before(async () => {
  await startTestDb();
  app = (await import("../app.js")).createApp();
  User = (await import("../models/user.js")).default;
  Machine = (await import("../models/machine.js")).default;
  Reading = (await import("../models/reading.js")).default;
  Alert = (await import("../models/alert.js")).default;
});

after(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await resetDb();
});

const seedUser = async (role, email) =>
  User.create({ name: role, email, password: await bcrypt.hash("password123", 10), role });

const loginToken = async (email, password = "password123") =>
  (await request(app).post("/api/auth/login").send({ email, password })).body.token;

const B = (t) => ({ Authorization: `Bearer ${t}` });

describe("Part 5 — Machines read endpoints", () => {
  test("GET /api/machines requires auth and lists machines", async () => {
    await Machine.create({ machineId: "M-001", name: "Press", location: "Bay 1" });
    assert.equal((await request(app).get("/api/machines")).status, 401);

    await seedUser("Viewer", "v@example.com");
    const res = await request(app).get("/api/machines").set(B(await loginToken("v@example.com")));
    assert.equal(res.status, 200);
    assert.equal(res.body.machines.length, 1);
    assert.equal(res.body.machines[0].machineId, "M-001");
  });

  test("GET /api/machines/:id returns the machine and its readings; 404 for unknown", async () => {
    await Machine.create({ machineId: "M-001", name: "Press" });
    await Reading.create({ machineId: "M-001", metric: "temperature", value: 70, ts: new Date() });
    await seedUser("Viewer", "v2@example.com");
    const token = await loginToken("v2@example.com");

    const ok = await request(app).get("/api/machines/M-001").set(B(token));
    assert.equal(ok.status, 200);
    assert.equal(ok.body.machine.machineId, "M-001");
    assert.equal(ok.body.readings.length, 1);

    const missing = await request(app).get("/api/machines/GHOST").set(B(token));
    assert.equal(missing.status, 404);
  });
});

describe("Part 5 — Alerts endpoints", () => {
  const seedAlert = () =>
    Alert.create({
      machineId: "M-001",
      metric: "temperature",
      breachValue: 96,
      threshold: 80,
      severity: "Critical",
      status: "open",
      ts: new Date(),
    });

  test("GET /api/alerts requires auth and lists active alerts", async () => {
    await seedAlert();
    assert.equal((await request(app).get("/api/alerts")).status, 401);

    await seedUser("Viewer", "v3@example.com");
    const res = await request(app).get("/api/alerts").set(B(await loginToken("v3@example.com")));
    assert.equal(res.status, 200);
    assert.equal(res.body.alerts.length, 1);
    assert.equal(res.body.alerts[0].severity, "Critical");
  });

  test("a Manager can acknowledge an alert; a Viewer cannot (403)", async () => {
    const alert = await seedAlert();
    await seedUser("Manager", "mgr@example.com");
    await seedUser("Viewer", "vwr@example.com");

    const viewer = await request(app)
      .patch(`/api/alerts/${alert._id}/acknowledge`)
      .set(B(await loginToken("vwr@example.com")));
    assert.equal(viewer.status, 403);

    const manager = await request(app)
      .patch(`/api/alerts/${alert._id}/acknowledge`)
      .set(B(await loginToken("mgr@example.com")));
    assert.equal(manager.status, 200);
    assert.equal(manager.body.alert.status, "acknowledged");
    assert.equal(manager.body.alert.acknowledged, true);
  });
});
