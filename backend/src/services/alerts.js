import Alert from "../models/alert.js";

const ACTIVE_STATUSES = ["open", "acknowledged"];

export const getActiveAlerts = (machineId) =>
  Alert.find({ machineId, status: { $in: ACTIVE_STATUSES } }).sort({ ts: -1 });

// Reconcile a machine's active alerts with its current breaches:
//   - a breached metric with no active alert  → open a new alert
//   - a breached metric with an active alert   → update in place (dedupe / escalate)
//   - an active alert whose metric no longer   → resolve (clear)
//     breaches
// Returns a summary of what changed. `ts` is the reading time that triggered it.
export const syncAlerts = async ({ machineId, breaches = [], ts = new Date() }) => {
  const active = await getActiveAlerts(machineId);
  const activeByMetric = new Map(active.map((alert) => [alert.metric, alert]));
  const breachByMetric = new Map(breaches.map((breach) => [breach.metric, breach]));

  const raised = [];

  for (const breach of breaches) {
    const existing = activeByMetric.get(breach.metric);

    if (!existing) {
      const created = await Alert.create({
        machineId,
        metric: breach.metric,
        breachValue: breach.value,
        threshold: breach.threshold,
        severity: breach.severity,
        status: "open",
        ts,
      });
      raised.push(created);
      continue;
    }

    // Dedupe: an active alert already covers this metric. Keep the latest
    // breach value and let severity escalate (Warning → Critical) without
    // creating a second alert.
    existing.breachValue = breach.value;
    existing.threshold = breach.threshold;
    existing.severity = breach.severity;
    existing.ts = ts;
    await existing.save();
  }

  const resolved = [];

  for (const alert of active) {
    if (!breachByMetric.has(alert.metric)) {
      alert.status = "resolved";
      alert.resolvedAt = ts;
      await alert.save();
      resolved.push(alert);
    }
  }

  return {
    raised,
    resolved,
    activeCount: breaches.length,
  };
};

export const acknowledgeAlert = async (alertId, userId = "") => {
  const alert = await Alert.findById(alertId);

  if (!alert) {
    const error = new Error("Alert not found");
    error.statusCode = 404;
    throw error;
  }

  if (alert.status === "resolved") {
    const error = new Error("Cannot acknowledge a resolved alert");
    error.statusCode = 409;
    throw error;
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = String(userId || "");
  alert.acknowledgedAt = new Date();
  alert.status = "acknowledged";
  await alert.save();

  return alert;
};
