import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";

import { resetDb, startTestDb, stopTestDb } from "./helpers.js";

let app;
let User;

before(async () => {
  await startTestDb();
  app = (await import("../app.js")).createApp();
  User = (await import("../models/user.js")).default;
});

beforeEach(async () => {
  await resetDb();
});

after(async () => {
  await stopTestDb();
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

describe("Part 1 — Auth spine, roles & scope", () => {
  test("self-register ignores a client-supplied role and yields Viewer (DoD)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "Manager", // must be ignored
      permissions: ["*"], // must be ignored
      tenantId: "acme", // must be ignored
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, "Viewer");

    const inDb = await User.findOne({ email: "alice@example.com" });
    assert.equal(inDb.role, "Viewer");
  });

  test("login returns access + refresh tokens for valid creds (DoD)", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "password123",
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, "expected an access token");
    assert.ok(res.body.refreshToken, "expected a refresh token");
  });

  test("login returns 401 for invalid credentials (DoD)", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob2@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "bob2@example.com",
      password: "wrong-password",
    });

    assert.equal(res.status, 401);
  });

  test("admin (Manager) create-user assigns a role; a Viewer is forbidden (DoD)", async () => {
    await seedUser("Manager", "manager@example.com");
    const managerToken = await loginToken("manager@example.com");

    const created = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Eng", email: "eng@example.com", password: "password123", role: "Engineer" });

    assert.equal(created.status, 201);
    assert.equal(created.body.user.role, "Engineer");

    // A Viewer (self-registered) must not be able to create users.
    await request(app).post("/api/auth/register").send({
      name: "Vic",
      email: "viewer@example.com",
      password: "password123",
    });
    const viewerToken = await loginToken("viewer@example.com");

    const forbidden = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ name: "X", email: "x@example.com", password: "password123", role: "Engineer" });

    assert.equal(forbidden.status, 403);
  });

  test("role/permission middleware permits Manager and 403s Viewer on a protected route (DoD)", async () => {
    await seedUser("Manager", "mgr2@example.com");
    await seedUser("Viewer", "vwr2@example.com");

    const managerRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${await loginToken("mgr2@example.com")}`);
    assert.equal(managerRes.status, 200);

    const viewerRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${await loginToken("vwr2@example.com")}`);
    assert.equal(viewerRes.status, 403);
  });

  test("a tampered / alg-swapped JWT is rejected (DoD)", async () => {
    const manager = await seedUser("Manager", "mgr3@example.com");

    // alg:"none" forgery
    const forged = jwt.sign(
      { id: String(manager._id), role: "Manager" },
      "",
      { algorithm: "none" }
    );
    const noneRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${forged}`);
    assert.equal(noneRes.status, 401);

    // HS256 signed with the wrong secret
    const wrongSig = jwt.sign(
      { id: String(manager._id), role: "Manager" },
      "a-totally-different-secret-value-32chars",
      { algorithm: "HS256" }
    );
    const wrongRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${wrongSig}`);
    assert.equal(wrongRes.status, 401);
  });

  test("out-of-scope routes are not mounted (scope reset)", async () => {
    for (const path of [
      "/api/copilot",
      "/api/enterprise",
      "/api/billing",
      "/api/audit",
      "/api/predictive",
      "/api/tenants",
      "/api/analytics",
    ]) {
      const res = await request(app).get(path);
      assert.equal(res.status, 404, `${path} should not be mounted`);
    }
  });
});

describe("Part 1 — error handling", () => {
  test("production error responses contain no stack trace (DoD)", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const { globalErrorHandler } = await import(
        "../middleware/errorMiddleware.js"
      );

      const error = new Error("boom");
      error.stack = "Error: boom\n    at secret (secret.js:1:1)";

      let payload;
      const res = {
        headersSent: false,
        status() {
          return this;
        },
        json(body) {
          payload = body;
          return this;
        },
      };

      globalErrorHandler(
        error,
        { originalUrl: "/api/x", method: "GET", headers: {} },
        res,
        () => {}
      );

      assert.ok(payload, "handler should send a payload");
      assert.equal(payload.success, false);
      assert.ok(
        !("stack" in payload),
        "production payload must not include a stack trace"
      );
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
