import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReportDeliverySummary,
  getNextRunAt,
} from "../src/services/reportAutomationService.js";

test("calculates next report run windows from frequency", () => {
  const start = new Date("2026-07-23T00:00:00.000Z");

  assert.equal(getNextRunAt(start, "daily").toISOString(), "2026-07-24T00:00:00.000Z");
  assert.equal(getNextRunAt(start, "weekly").toISOString(), "2026-07-30T00:00:00.000Z");
  assert.equal(getNextRunAt(start, "monthly").toISOString(), "2026-08-22T00:00:00.000Z");
});

test("builds compact report delivery summaries for audit logs", () => {
  const summary = buildReportDeliverySummary({
    machines: [{ machineId: "M-1" }],
    notifications: [{ id: "N-1" }, { id: "N-2" }],
    report: {
      generatedAt: "2026-07-23T00:00:00.000Z",
      lines: ["one", "two", "three"],
      reportId: "KAVACH-AUTOMATED-1",
    },
    workOrders: [{ id: "WO-1" }],
  });

  assert.equal(summary.reportId, "KAVACH-AUTOMATED-1");
  assert.equal(summary.lineCount, 3);
  assert.equal(summary.machines, 1);
  assert.equal(summary.notifications, 2);
  assert.equal(summary.workOrders, 1);
});
