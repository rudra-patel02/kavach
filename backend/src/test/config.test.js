import { after, afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";

let getEnvironmentConfig;
const ORIGINAL_ENV = { ...process.env };

// Strong, placeholder-free secrets for the "valid" cases.
const STRONG = "S3cure-random-jwt-key-9f2a7c1e8b4d6a0f3e5c-01";
const STRONG2 = "An0ther-strong-refresh-7d1b9e3f5a2c8046-longer";

before(async () => {
  ({ getEnvironmentConfig } = await import("../config/environment.js"));
});

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

afterEach(restoreEnv);
after(restoreEnv);

const setProdEnv = (overrides = {}) => {
  process.env.NODE_ENV = "production";
  process.env.MONGO_URI = "mongodb://mongo:27017/kavach";
  process.env.JWT_SECRET = STRONG;
  process.env.JWT_REFRESH_SECRET = STRONG2;
  process.env.CORS_ORIGIN = "https://plant.example.com";
  Object.assign(process.env, overrides);
};

describe("Part 6 — production boot guard", () => {
  test("a valid, strong production config boots", () => {
    setProdEnv();
    assert.doesNotThrow(() => getEnvironmentConfig());
  });

  test("a placeholder JWT_SECRET is refused in production (DoD)", () => {
    setProdEnv({ JWT_SECRET: "replace-with-a-random-secret-at-least-32-characters-long" });
    assert.throws(() => getEnvironmentConfig(), /placeholder|JWT_SECRET/i);
  });

  test("a too-short JWT_SECRET is refused in production (DoD)", () => {
    setProdEnv({ JWT_SECRET: "short" });
    assert.throws(() => getEnvironmentConfig());
  });

  test("a wildcard CORS_ORIGIN is refused in production (DoD)", () => {
    setProdEnv({ CORS_ORIGIN: "*" });
    assert.throws(() => getEnvironmentConfig(), /CORS_ORIGIN/);
  });

  test("a missing MONGO_URI is refused", () => {
    setProdEnv();
    delete process.env.MONGO_URI;
    assert.throws(() => getEnvironmentConfig());
  });

  test("a short secret only warns (does not throw) outside production", () => {
    setProdEnv({ NODE_ENV: "development", JWT_SECRET: "short" });
    assert.doesNotThrow(() => getEnvironmentConfig());
  });
});
