import assert from "node:assert/strict";
import test from "node:test";

import { deviceAuthMiddleware } from "../src/middleware/deviceAuthMiddleware.js";

const createResponse = () => {
  const response = {
    body: null,
    statusCode: 200,
    json(payload) {
      this.body = payload;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };

  return response;
};

test("device auth rejects sensor writes when DEVICE_SECRET is configured", () => {
  const previousSecret = process.env.DEVICE_SECRET;
  process.env.DEVICE_SECRET = "device-secret";
  const response = createResponse();
  let nextCalled = false;

  deviceAuthMiddleware(
    {
      body: {},
      get: () => undefined,
    },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
  assert.equal(nextCalled, false);

  if (previousSecret === undefined) {
    delete process.env.DEVICE_SECRET;
  } else {
    process.env.DEVICE_SECRET = previousSecret;
  }
});

test("device auth strips accepted body secret before controller handling", () => {
  const previousSecret = process.env.DEVICE_SECRET;
  process.env.DEVICE_SECRET = "device-secret";
  const body = { deviceSecret: "device-secret", deviceId: "esp32-001" };
  const response = createResponse();
  let nextCalled = false;

  deviceAuthMiddleware(
    {
      body,
      get: () => undefined,
    },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal("deviceSecret" in body, false);

  if (previousSecret === undefined) {
    delete process.env.DEVICE_SECRET;
  } else {
    process.env.DEVICE_SECRET = previousSecret;
  }
});
