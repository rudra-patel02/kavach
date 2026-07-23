import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPushPayload,
  normalizePushSubscription,
  summarizePushDelivery,
} from "../src/services/pushNotificationService.js";

test("normalizes browser push subscription payloads with tenant context", () => {
  const subscription = normalizePushSubscription(
    {
      subscription: {
        endpoint: "https://push.example/subscription/1",
        keys: {
          auth: "auth-token",
          p256dh: "public-key",
        },
      },
    },
    {
      plantId: "plant-1",
      tenantId: "tenant-1",
      userId: "user-1",
    }
  );

  assert.equal(subscription.endpoint, "https://push.example/subscription/1");
  assert.equal(subscription.keys.auth, "auth-token");
  assert.equal(subscription.tenantId, "tenant-1");
  assert.equal(subscription.userId, "user-1");
});

test("rejects invalid push subscriptions", () => {
  assert.throws(
    () => normalizePushSubscription({ endpoint: "missing-keys" }),
    /Valid push subscription/
  );
});

test("builds stable notification payloads for service workers", () => {
  const payload = buildPushPayload({
    _id: "notification-1",
    machineId: "M-100",
    message: "Bearing temperature is critical",
    severity: "Critical",
    title: "Critical machine alert",
  });

  assert.equal(payload.title, "Critical machine alert");
  assert.equal(payload.data.url, "/machines/M-100");
  assert.equal(payload.data.severity, "Critical");
});

test("summarizes active and skipped push delivery targets", () => {
  const summary = summarizePushDelivery(
    [
      { endpoint: "active-1", status: "active" },
      { endpoint: "disabled-1", status: "disabled" },
    ],
    { title: "Alert" }
  );

  assert.equal(summary.attempted, 2);
  assert.equal(summary.skipped, 1);
  assert.deepEqual(summary.targetEndpoints, ["active-1"]);
});
