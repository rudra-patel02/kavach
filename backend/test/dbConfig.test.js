import assert from "node:assert/strict";
import test from "node:test";

import connectDB, { getMongoUriMetadata } from "../src/config/db.js";

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

test("rejects placeholder MongoDB URIs before DNS lookup", async () => {
  const previousMongoUri = process.env.MONGO_URI;

  process.env.MONGO_URI = "mongodb+srv://<user>:<password>@<cluster>/<database>";

  try {
    await assert.rejects(
      () => connectDB(),
      /MONGO_URI contains placeholder tokens/
    );
  } finally {
    if (previousMongoUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = previousMongoUri;
    }
  }
});
