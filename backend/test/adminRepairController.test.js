import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdminRepairKeyFromRequest,
  validateAdminRepairKey,
} from "../src/controllers/adminRepairController.js";

test("admin repair key can be read from bearer auth or repair header", () => {
  assert.equal(
    getAdminRepairKeyFromRequest({
      body: {},
      headers: {
        authorization: "Bearer secret-one",
      },
    }),
    "secret-one"
  );
  assert.equal(
    getAdminRepairKeyFromRequest({
      body: {},
      headers: {
        "x-admin-repair-key": "secret-two",
      },
    }),
    "secret-two"
  );
});

test("admin repair key validation requires configured env key", () => {
  const previousKey = process.env.ADMIN_REPAIR_KEY;

  process.env.ADMIN_REPAIR_KEY = "expected-key";

  try {
    assert.equal(validateAdminRepairKey("expected-key"), true);
    assert.equal(validateAdminRepairKey("wrong-key"), false);
  } finally {
    if (previousKey === undefined) {
      delete process.env.ADMIN_REPAIR_KEY;
    } else {
      process.env.ADMIN_REPAIR_KEY = previousKey;
    }
  }
});
