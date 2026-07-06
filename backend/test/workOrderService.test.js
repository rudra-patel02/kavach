import assert from "node:assert/strict";
import test from "node:test";

import {
  serializeWorkOrder,
  shouldCreateWorkOrderForMachine,
} from "../src/services/workOrderService.js";

const healthyMachine = {
  machineId: "M100",
  name: "Healthy Machine",
  department: "Production",
  status: "Running",
  health: 96,
  temperature: 52,
  vibration: 0.18,
  pressure: 1.1,
  power: 30,
  energyConsumed: 280,
  aiPrediction: {
    failureRisk: "Low",
    maintenancePriority: "Low",
    maintenanceInDays: 30,
    recommendation: "Machine is healthy.",
  },
};

test("does not require a work order for healthy machines", () => {
  const assessment = shouldCreateWorkOrderForMachine(healthyMachine);

  assert.equal(assessment.shouldCreate, false);
  assert.deepEqual(assessment.triggers, []);
});

test("requires a work order for immediate AI maintenance and severe risk", () => {
  const assessment = shouldCreateWorkOrderForMachine({
    ...healthyMachine,
    status: "Critical",
    health: 22,
    temperature: 99,
    vibration: 1.5,
    energyConsumed: 980,
    aiPrediction: {
      failureRisk: "High",
      maintenancePriority: "Immediate",
      maintenanceInDays: 1,
      recommendation: "Inspect immediately.",
    },
  });

  assert.equal(assessment.shouldCreate, true);
  assert.match(assessment.triggers.join(" "), /Immediate/);
  assert.match(assessment.triggers.join(" "), /Failure probability/);
  assert.match(assessment.triggers.join(" "), /Machine health/);
});

test("serializes CMMS aliases for enterprise work order clients", () => {
  const serializedWorkOrder = serializeWorkOrder({
    _id: "507f1f77bcf86cd799439011",
    actualHours: 1.5,
    approvalStatus: "Pending",
    assignedEngineer: "Maintenance Engineer",
    attachments: [],
    checklist: [],
    completedAt: null,
    costEstimate: 1200,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: "Plant Manager",
    department: "Packaging",
    description: "Inspect line vibration",
    dueDate: new Date("2026-01-02T00:00:00.000Z"),
    estimatedHours: 3,
    estimatedRepairCost: 1200,
    history: [],
    machineId: "M100",
    machineName: "Packaging Line",
    maintenanceChecklist: [{ completed: false, label: "Lockout/tagout" }],
    maintenanceType: "Preventive",
    notes: [],
    notificationHistory: [],
    priority: "HIGH",
    severity: "High",
    status: "OPEN",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    workOrderId: "WO-20260101-1000",
  });

  assert.equal(serializedWorkOrder.createdBy, "Plant Manager");
  assert.equal(serializedWorkOrder.maintenanceType, "Preventive");
  assert.equal(serializedWorkOrder.estimatedHours, 3);
  assert.equal(serializedWorkOrder.costEstimate, 1200);
  assert.equal(serializedWorkOrder.approvalStatus, "Pending");
  assert.equal(serializedWorkOrder.checklist[0].label, "Lockout/tagout");
});
