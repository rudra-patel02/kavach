import assert from "node:assert/strict";
import test from "node:test";

import { getMongoUriMetadata } from "../src/config/db.js";

test("extracts MongoDB URI metadata without credentials", () => {
  const metadata = getMongoUriMetadata(
    "mongodb+srv://user:secret@example.mongodb.net/kavach?retryWrites=true&w=majority"
  );

  assert.deepEqual(metadata, {
    configured: true,
    database: "kavach",
    hosts: ["example.mongodb.net"],
    protocol: "mongodb+srv",
  });
  assert.equal(JSON.stringify(metadata).includes("secret"), false);
  assert.equal(JSON.stringify(metadata).includes("user"), false);
});

test("reports missing MongoDB URI as unconfigured", () => {
  assert.deepEqual(getMongoUriMetadata(""), {
    configured: false,
    database: "",
    hosts: [],
    protocol: "",
  });
});
