import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import bcrypt from "bcryptjs";
import request from "supertest";

import { resetDb, startTestDb, stopTestDb } from "./helpers.js";

let app;
let User;
let Machine;
let Alert;
let WorkOrder;

const HOUR = 3_600_000;

before(async () => {
  await startTestDb();
  app = (await import("../app.js")).createApp();
  User = (await import("../models/user.js")).default;
  Machine = (await import("../models/machine.js")).default;
  Alert = (await import("../models/alert.js")).default;
  WorkOrder = (await import("../models/workOrder.js")).default;
});

after(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await resetDb();
});

const seedUser = async (role, email) =>
  User.create({
    name: role,
    email,
    password: await bcrypt.hash("password123", 10),
    role,
  });

const loginToken = async (email, password = "password123") => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
};

const seedMachine = (machineId, name = machineId) =>
  Machine.create({ machineId, name, location: "Plant A" });

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Seed the common cast: a manager, two engineers, a viewer, and two machines.
const seedCast = async () => {
  const [manager, engA, engB, viewer] = await Promise.all([
    seedUser("Manager", "manager@example.com"),
    seedUser("Engineer", "eng-a@example.com"),
    seedUser("Engineer", "eng-b@example.com"),
    seedUser("Viewer", "viewer@example.com"),
  ]);
  await Promise.all([seedMachine("M-001"), seedMachine("M-002")]);
  const [managerToken, engAToken, engBToken, viewerToken] = await Promise.all([
    loginToken("manager@example.com"),
    loginToken("eng-a@example.com"),
    loginToken("eng-b@example.com"),
    loginToken("viewer@example.com"),
  ]);
  return {
    manager,
    engA,
    engB,
    viewer,
    managerToken,
    engAToken,
    engBToken,
    viewerToken,
  };
};

describe("Part 4 — Work Orders & the Closed Loop", () => {
  test("Manager creates + assigns → status Assigned, linked to machine & alert (DoD)", async () => {
    const { manager, engA, managerToken } = await seedCast();
    const alert = await Alert.create({
      machineId: "M-001",
      metric: "temperature",
      breachValue: 95,
      threshold: 80,
      severity: "Critical",
      ts: new Date(),
    });

    const res = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({
        machineId: "M-001",
        title: "Cooling fault",
        priority: "High",
        assigneeId: String(engA._id),
        linkedAlertId: String(alert._id),
      });

    assert.equal(res.status, 201);
    const wo = res.body.workOrder;
    assert.equal(wo.status, "Assigned");
    assert.equal(wo.machineId, "M-001");
    assert.equal(wo.assigneeId, String(engA._id));
    assert.equal(wo.linkedAlertId, String(alert._id));
    assert.equal(wo.priority, "High");
    // createdBy comes from the token, never the body.
    assert.equal(wo.createdBy, String(manager._id));
  });

  test("Manager creates without an assignee → status Open", async () => {
    const { managerToken } = await seedCast();

    const res = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Inspect belt" });

    assert.equal(res.status, 201);
    assert.equal(res.body.workOrder.status, "Open");
    assert.equal(res.body.workOrder.assigneeId, "");
  });

  test("Engineer advances only their own work order, one step forward (DoD)", async () => {
    const { engA, managerToken, engAToken } = await seedCast();

    const created = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Fix motor", assigneeId: String(engA._id) });
    const id = created.body.workOrder.id;

    // Assigned → In Progress (valid single step).
    const advanced = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engAToken))
      .send({ status: "In Progress" });

    assert.equal(advanced.status, 200);
    assert.equal(advanced.body.workOrder.status, "In Progress");

    // In Progress → Resolved (valid), sets resolvedAt.
    const resolved = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engAToken))
      .send({ status: "Resolved" });

    assert.equal(resolved.status, 200);
    assert.equal(resolved.body.workOrder.status, "Resolved");
    assert.ok(resolved.body.workOrder.resolvedAt, "expected resolvedAt to be set");
  });

  test("Engineer invalid transition (skipping a step) is rejected (DoD)", async () => {
    const { engA, managerToken, engAToken } = await seedCast();

    const created = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Fix motor", assigneeId: String(engA._id) });
    const id = created.body.workOrder.id;

    // Assigned → Resolved skips In Progress → rejected.
    const skip = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engAToken))
      .send({ status: "Resolved" });
    assert.equal(skip.status, 400);

    // Move to In Progress, then attempt a backward transition → rejected.
    await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engAToken))
      .send({ status: "In Progress" });
    const backward = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engAToken))
      .send({ status: "Assigned" });
    assert.equal(backward.status, 400);
  });

  test("Engineer cannot advance a work order assigned to someone else (scoped) (DoD)", async () => {
    const { engA, managerToken, engBToken } = await seedCast();

    const created = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Fix motor", assigneeId: String(engA._id) });
    const id = created.body.workOrder.id;

    // Engineer B is not the assignee → the work order is outside their scope.
    const res = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(engBToken))
      .send({ status: "In Progress" });
    assert.equal(res.status, 404);

    // And it must be untouched.
    const inDb = await WorkOrder.findById(id).lean();
    assert.equal(inDb.status, "Assigned");
  });

  test("Viewer cannot create a work order (403) (DoD)", async () => {
    const { engA, viewerToken } = await seedCast();

    const res = await request(app)
      .post("/api/workorders")
      .set(auth(viewerToken))
      .send({ machineId: "M-001", title: "Nope", assigneeId: String(engA._id) });
    assert.equal(res.status, 403);
  });

  test("Viewer cannot update a work order (403) (DoD)", async () => {
    const { engA, managerToken, viewerToken } = await seedCast();

    const created = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Fix motor", assigneeId: String(engA._id) });
    const id = created.body.workOrder.id;

    const res = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(viewerToken))
      .send({ status: "In Progress" });
    assert.equal(res.status, 403);
  });

  test("Update ignores mass-assignment of createdBy / machineId (DoD)", async () => {
    const { manager, engA, managerToken } = await seedCast();

    const created = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Fix motor", assigneeId: String(engA._id) });
    const id = created.body.workOrder.id;

    const res = await request(app)
      .patch(`/api/workorders/${id}`)
      .set(auth(managerToken))
      .send({
        status: "In Progress",
        createdBy: "hacker",
        machineId: "M-002",
        linkedAlertId: "spoofed",
        _id: "000000000000000000000000",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.workOrder.status, "In Progress");

    const inDb = await WorkOrder.findById(id).lean();
    assert.equal(inDb.createdBy, String(manager._id)); // unchanged
    assert.equal(inDb.machineId, "M-001"); // unchanged
    assert.equal(inDb.linkedAlertId, ""); // never set from body
  });

  test("A duplicate active work order for a machine is rejected (409) (DoD)", async () => {
    const { managerToken } = await seedCast();

    const first = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "First" });
    assert.equal(first.status, 201);

    const second = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Second" });
    assert.equal(second.status, 409);
  });

  test("Resolving a work order frees the machine for a new one", async () => {
    const { engA, managerToken } = await seedCast();

    const first = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "First", assigneeId: String(engA._id) });
    const id = first.body.workOrder.id;

    // Advance to Resolved (Assigned → In Progress → Resolved).
    await request(app).patch(`/api/workorders/${id}`).set(auth(managerToken)).send({ status: "In Progress" });
    await request(app).patch(`/api/workorders/${id}`).set(auth(managerToken)).send({ status: "Resolved" });

    // The machine slot is free again.
    const second = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "Second" });
    assert.equal(second.status, 201);
  });

  test("List is scoped to the caller: engineer sees only their own, manager sees all (DoD)", async () => {
    const { engA, engB, managerToken, engAToken } = await seedCast();

    // One work order per machine (one-active-per-machine), assigned to each engineer.
    await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-001", title: "A's job", assigneeId: String(engA._id) });
    await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "M-002", title: "B's job", assigneeId: String(engB._id) });

    const engineerList = await request(app).get("/api/workorders").set(auth(engAToken));
    assert.equal(engineerList.status, 200);
    assert.equal(engineerList.body.workOrders.length, 1);
    assert.equal(engineerList.body.workOrders[0].assigneeId, String(engA._id));

    const managerList = await request(app).get("/api/workorders").set(auth(managerToken));
    assert.equal(managerList.status, 200);
    assert.equal(managerList.body.workOrders.length, 2);
  });

  test("Creating for an unknown machine is rejected (404)", async () => {
    const { managerToken } = await seedCast();

    const res = await request(app)
      .post("/api/workorders")
      .set(auth(managerToken))
      .send({ machineId: "GHOST", title: "Nowhere" });
    assert.equal(res.status, 404);
  });

  test("An unauthenticated request is rejected (401)", async () => {
    const res = await request(app).get("/api/workorders");
    assert.equal(res.status, 401);
  });

  test("A resolved work order's repair interval drives machine MTTR via /api/kpis (closed loop)", async () => {
    const { viewerToken } = await seedCast();

    const now = Date.now();
    // A resolved work order: created 3h ago, resolved 1h ago → 2h repair, both
    // inside the default 24h KPI window. createdAt is backdated with a direct
    // update because Mongoose `timestamps` overrides it on create().
    const wo = await WorkOrder.create({
      machineId: "M-001",
      title: "Repaired",
      status: "Resolved",
      createdBy: "manager",
      resolvedAt: new Date(now - 1 * HOUR),
    });
    // Native collection write: Mongoose marks createdAt immutable under
    // `timestamps`, so a model-level $set would be stripped.
    await WorkOrder.collection.updateOne(
      { _id: wo._id },
      { $set: { createdAt: new Date(now - 3 * HOUR) } }
    );

    const res = await request(app).get("/api/kpis").set(auth(viewerToken));
    assert.equal(res.status, 200);

    const machine = res.body.machines.find((m) => m.machineId === "M-001");
    assert.ok(machine, "expected M-001 in the KPI response");
    assert.ok(
      Math.abs(machine.mttrHours - 2) < 1e-6,
      `expected MTTR ≈ 2h from the resolved work order, got ${machine.mttrHours}`
    );
  });
});
