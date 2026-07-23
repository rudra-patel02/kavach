import assert from "node:assert/strict";
import test from "node:test";

import { buildMachineCreatePayload } from "../src/controllers/machineController.js";

test("machine create payload uses tenant context plant scope", () => {
  const payload = buildMachineCreatePayload({
    body: {
      department: "Production",
      machineId: "M-NEW",
      name: "New Machine",
      status: "Running",
    },
    tenantContext: {
      plantId: "plant-from-context",
      tenantId: "tenant-1",
    },
    user: {
      activePlantId: "",
      organizationId: "org-1",
      tenantId: "tenant-1",
    },
  });

  assert.equal(payload.plantId, "plant-from-context");
  assert.equal(payload.tenantId, "tenant-1");
  assert.equal(payload.organizationId, "org-1");
});
