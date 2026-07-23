import assert from "node:assert/strict";
import test from "node:test";

import { securityHeaders } from "../src/middleware/securityMiddleware.js";

test("allows CORS-approved API responses to be read cross-origin", () => {
  const headers = new Map();
  const res = {
    setHeader(name, value) {
      headers.set(name, value);
    },
  };

  securityHeaders({}, res, () => {});

  assert.equal(headers.get("Cross-Origin-Resource-Policy"), "cross-origin");
  assert.match(headers.get("Content-Security-Policy"), /connect-src 'self' ws: wss:/);
});
