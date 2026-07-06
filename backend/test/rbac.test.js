import assert from "node:assert/strict";
import test from "node:test";

import {
  hasAnyRole,
  hasPermission,
  normalizeRole,
} from "../src/security/rbac.js";

test("normalizes legacy roles to enterprise RBAC roles", () => {
  assert.equal(normalizeRole("Admin"), "Super Admin");
  assert.equal(normalizeRole("Organization Admin"), "Organization Admin");
  assert.equal(normalizeRole("Plant Manager"), "Plant Admin");
  assert.equal(normalizeRole("Maintenance Engineer"), "Engineer");
});

test("supports permission checks and manager inheritance", () => {
  assert.equal(hasPermission("Super Admin", "system:read"), true);
  assert.equal(hasPermission("Viewer", "users:manage"), false);
  assert.equal(
    hasAnyRole("Maintenance Manager", ["Maintenance Engineer"]),
    true
  );
  assert.equal(hasPermission("Organization Admin", "enterprise:manage"), true);
  assert.equal(hasAnyRole("Organization Admin", ["Plant Admin"]), true);
});
