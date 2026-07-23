import assert from "node:assert/strict";
import test from "node:test";

import {
  getErrorDetails,
  getHttpStatusForError,
} from "../src/utils/httpErrorResponse.js";

test("maps mongoose validation failures to 400 details", () => {
  const error = {
    name: "ValidationError",
    errors: {
      machineId: {
        path: "machineId",
        message: "Path `machineId` is required.",
      },
    },
  };

  assert.equal(getHttpStatusForError(error), 400);
  assert.deepEqual(getErrorDetails(error), [
    {
      field: "machineId",
      message: "Path `machineId` is required.",
    },
  ]);
});

test("maps duplicate key failures to 409 details", () => {
  const error = {
    code: 11000,
    keyPattern: {
      machineId: 1,
    },
  };

  assert.equal(getHttpStatusForError(error), 409);
  assert.deepEqual(getErrorDetails(error), [
    {
      field: "machineId",
      message: "machineId must be unique",
    },
  ]);
});

test("maps MongoDB connectivity failures to 503", () => {
  assert.equal(
    getHttpStatusForError({
      name: "MongooseServerSelectionError",
      message: "Could not connect to any servers",
    }),
    503
  );
});
