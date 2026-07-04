import assert from "node:assert/strict";
import test from "node:test";

import predictMachine from "../ai/prediction.js";

test("returns a low-risk prediction for a healthy machine", () => {
  assert.deepEqual(
    predictMachine({
      health: 95,
      temperature: 60,
      status: "Running",
    }),
    {
      failureRisk: "Low",
      maintenancePriority: "Low",
      maintenanceInDays: 30,
      recommendation: "Machine is healthy.",
    }
  );
});

test("returns a medium-risk prediction for a warning machine", () => {
  assert.deepEqual(
    predictMachine({
      health: 65,
      temperature: 70,
      status: "Warning",
    }),
    {
      failureRisk: "Medium",
      maintenancePriority: "Soon",
      maintenanceInDays: 7,
      recommendation: "Schedule preventive maintenance.",
    }
  );
});

test("returns a high-risk prediction for a critical machine", () => {
  assert.deepEqual(
    predictMachine({
      health: 35,
      temperature: 95,
      status: "Critical",
    }),
    {
      failureRisk: "High",
      maintenancePriority: "Immediate",
      maintenanceInDays: 1,
      recommendation:
        "High probability of failure. Shut down and inspect immediately.",
    }
  );
});
