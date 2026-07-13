import assert from "node:assert/strict";
import test from "node:test";

import bcrypt from "bcryptjs";

import { ADMIN_PASSWORD, isBcryptHash } from "../src/services/adminUserService.js";

test("seeded admin password is expected to be bcrypt-hashed", async () => {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  assert.equal(isBcryptHash(hash), true);
  assert.equal(await bcrypt.compare(ADMIN_PASSWORD, hash), true);
});

test("plain text admin password is not accepted as stored format", () => {
  assert.equal(isBcryptHash(ADMIN_PASSWORD), false);
});
