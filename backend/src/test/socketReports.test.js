import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { io as ioClient } from "socket.io-client";

import { resetDb, startTestDb, stopTestDb, TEST_ENV } from "./helpers.js";

let app;
let User;
let Machine;
let authenticateHandshake;
let initSocket;
let closeSocket;

before(async () => {
  await startTestDb();
  app = (await import("../app.js")).createApp();
  User = (await import("../models/user.js")).default;
  Machine = (await import("../models/machine.js")).default;
  ({ authenticateHandshake, initSocket, closeSocket } = await import("../socket/index.js"));
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

describe("Part 5 — Socket.IO authenticated handshake", () => {
  test("handshake auth rejects a tokenless connection and accepts a valid JWT (DoD)", () => {
    // tokenless
    assert.throws(() => authenticateHandshake({ auth: {}, headers: {} }));
    // tampered / alg-none forgery
    const forged = jwt.sign({ id: "x", role: "Manager" }, "", { algorithm: "none" });
    assert.throws(() => authenticateHandshake({ auth: { token: forged } }));
    // wrong secret
    const wrong = jwt.sign({ id: "x", role: "Manager" }, "another-secret-value-32-characters-xx", {
      algorithm: "HS256",
    });
    assert.throws(() => authenticateHandshake({ auth: { token: wrong } }));
    // valid
    const good = jwt.sign({ id: "x", role: "Manager" }, TEST_ENV.JWT_SECRET, { algorithm: "HS256" });
    const decoded = authenticateHandshake({ auth: { token: good } });
    assert.equal(decoded.role, "Manager");
    // valid via Authorization header
    const viaHeader = authenticateHandshake({ headers: { authorization: `Bearer ${good}` } });
    assert.equal(viaHeader.id, "x");
  });

  test("a real tokenless socket connection is refused; a valid one connects (DoD)", async () => {
    await seedUser("Manager", "mgr@example.com");
    const token = await loginToken("mgr@example.com");

    const server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();
    const url = `http://localhost:${port}`;

    try {
      // No token → connect_error.
      const refused = await new Promise((resolve) => {
        const c = ioClient(url, { transports: ["websocket"], reconnection: false });
        c.on("connect", () => resolve({ connected: true, c }));
        c.on("connect_error", (err) => resolve({ connected: false, message: err.message, c }));
      });
      assert.equal(refused.connected, false);
      refused.c.close();

      // Valid token → connects and receives the welcome event.
      const accepted = await new Promise((resolve) => {
        const c = ioClient(url, {
          transports: ["websocket"],
          reconnection: false,
          auth: { token },
        });
        c.on("connected", (payload) => resolve({ connected: true, payload, c }));
        c.on("connect_error", (err) => resolve({ connected: false, message: err.message, c }));
      });
      assert.equal(accepted.connected, true);
      assert.equal(accepted.payload.ok, true);
      accepted.c.close();
    } finally {
      await closeSocket();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe("Part 5 — Reports export mirrors the dashboard KPIs", () => {
  test("GET /api/reports/kpis requires auth (DoD)", async () => {
    const res = await request(app).get("/api/reports/kpis");
    assert.equal(res.status, 401);
  });

  test("report JSON equals the /api/kpis numbers for the same window (DoD)", async () => {
    await Machine.create({ machineId: "M-001", name: "Press", location: "Bay 1", ratedThroughput: 100 });
    await seedUser("Viewer", "viewer@example.com");
    const token = await loginToken("viewer@example.com");

    // Same explicit window so both reads compute over identical bounds.
    const from = new Date("2026-07-01T00:00:00Z").toISOString();
    const to = new Date("2026-07-02T00:00:00Z").toISOString();
    const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const kpis = await request(app).get(`/api/kpis?${q}`).set("Authorization", `Bearer ${token}`);
    const report = await request(app)
      .get(`/api/reports/kpis?${q}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(kpis.status, 200);
    assert.equal(report.status, 200);
    assert.deepEqual(report.body.plant, kpis.body.plant);
    assert.deepEqual(report.body.machines, kpis.body.machines);
  });

  test("CSV export returns a text/csv attachment with the plant row", async () => {
    await Machine.create({ machineId: "M-001", name: "Press", location: "Bay 1" });
    await seedUser("Viewer", "viewer2@example.com");
    const token = await loginToken("viewer2@example.com");

    const res = await request(app)
      .get("/api/reports/kpis?format=csv")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.match(res.headers["content-type"], /text\/csv/);
    assert.match(res.text, /KAVACH plant KPI report/);
    assert.match(res.text, /PLANT/);
  });
});
