import assert from "node:assert/strict";
import test from "node:test";

import { createSimplePdf, toCsv } from "../src/utils/exportUtils.js";

test("creates CSV with escaped values for enterprise exports", () => {
  const csv = toCsv(
    [{ id: "WO-1", message: 'Inspect "Line A", urgent' }],
    [
      { header: "ID", key: "id" },
      { header: "Message", key: "message" },
    ]
  );

  assert.match(csv, /ID,Message/);
  assert.match(csv, /"Inspect ""Line A"", urgent"/);
});

test("creates a valid PDF buffer for lightweight exports", () => {
  const pdf = createSimplePdf({
    lines: ["WO-1 | Pump | HIGH | OPEN"],
    title: "Work Orders",
  });

  assert.equal(Buffer.isBuffer(pdf), true);
  assert.equal(pdf.subarray(0, 8).toString(), "%PDF-1.4");
  assert.match(pdf.toString("utf8"), /startxref/);
});
