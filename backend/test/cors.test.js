import assert from "node:assert/strict";
import test from "node:test";

import { buildCorsOptions, normalizeOrigin } from "../src/config/cors.js";
import { parseBoolean, parseCorsOrigins } from "../src/config/environment.js";

const PRODUCTION_ORIGIN = "https://kavach-1-7749.onrender.com";

test("normalizes configured CORS origins", () => {
  assert.deepEqual(
    parseCorsOrigins(`${PRODUCTION_ORIGIN}/, https://other.example/path`),
    [PRODUCTION_ORIGIN, "https://other.example"]
  );
  assert.equal(normalizeOrigin(`${PRODUCTION_ORIGIN}/dashboard`), PRODUCTION_ORIGIN);
});

test("builds shared CORS options for Express and Socket.IO", async () => {
  const options = buildCorsOptions([PRODUCTION_ORIGIN], {
    credentials: parseBoolean("true"),
  });

  assert.deepEqual(options.methods, [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ]);
  assert.deepEqual(options.allowedHeaders, ["Content-Type", "Authorization"]);
  assert.equal(options.credentials, true);
  assert.equal(options.optionsSuccessStatus, 204);

  await new Promise((resolve, reject) => {
    options.origin(PRODUCTION_ORIGIN, (error, allowed) => {
      try {
        assert.ifError(error);
        assert.equal(allowed, true);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });
});

test("rejects disallowed browser origins", async () => {
  const options = buildCorsOptions([PRODUCTION_ORIGIN]);

  await new Promise((resolve, reject) => {
    options.origin("https://evil.example", (error) => {
      try {
        assert.equal(error.message, "Origin is not allowed by CORS");
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });
});

test("does not enable credentials with wildcard origins", () => {
  const options = buildCorsOptions("*", { credentials: true });

  assert.equal(options.origin, "*");
  assert.equal(options.credentials, false);
});
