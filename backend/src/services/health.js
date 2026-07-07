// Pure, deterministic health engine. Given a machine's thresholds and a set of
// readings, it maps the latest value per metric to a severity, then rolls those
// up into an overall status + healthScore. No I/O, no clock — same inputs always
// produce the same output, which is what the Part 2 tests pin.

// Penalty applied to the 0–100 healthScore per breached metric.
const SEVERITY_PENALTY = {
  Warning: 20,
  Critical: 50,
};

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

// Compare a single value against one metric's threshold bounds. Critical wins
// over Warning; an omitted bound is simply not checked.
export const evaluateMetric = (value, threshold = {}) => {
  if (!isNumber(value)) {
    return { severity: null, threshold: null };
  }

  const { warnMin, warnMax, critMin, critMax } = threshold;

  if (isNumber(critMax) && value >= critMax) {
    return { severity: "Critical", threshold: critMax };
  }
  if (isNumber(critMin) && value <= critMin) {
    return { severity: "Critical", threshold: critMin };
  }
  if (isNumber(warnMax) && value >= warnMax) {
    return { severity: "Warning", threshold: warnMax };
  }
  if (isNumber(warnMin) && value <= warnMin) {
    return { severity: "Warning", threshold: warnMin };
  }

  return { severity: null, threshold: null };
};

// Reduce a flat list of readings to the newest value per metric. Readings
// without a `ts` are treated as arriving in array order (later wins).
export const latestReadingPerMetric = (readings = []) => {
  const latest = new Map();

  readings.forEach((reading, index) => {
    if (!reading || !reading.metric) {
      return;
    }

    const at = reading.ts ? new Date(reading.ts).getTime() : index;
    const current = latest.get(reading.metric);

    if (!current || at >= current.at) {
      latest.set(reading.metric, { ...reading, at });
    }
  });

  return latest;
};

// Map latest readings against a machine's thresholds → { healthScore, status,
// breaches }. Metrics without a configured threshold are ignored (we never
// invent health from data we don't have a rule for).
export const computeHealth = (machine = {}, readings = []) => {
  const thresholds = Array.isArray(machine.thresholds) ? machine.thresholds : [];
  const thresholdByMetric = new Map(thresholds.map((t) => [t.metric, t]));
  const latest = latestReadingPerMetric(readings);

  const breaches = [];

  for (const [metric, reading] of latest) {
    const threshold = thresholdByMetric.get(metric);
    if (!threshold) {
      continue;
    }

    const { severity, threshold: bound } = evaluateMetric(reading.value, threshold);
    if (severity) {
      breaches.push({
        metric,
        value: reading.value,
        severity,
        threshold: bound,
        unit: threshold.unit || "",
        ts: reading.ts,
      });
    }
  }

  const penalty = breaches.reduce(
    (sum, breach) => sum + (SEVERITY_PENALTY[breach.severity] || 0),
    0
  );
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  let status = "Running";
  if (breaches.some((b) => b.severity === "Critical")) {
    status = "Critical";
  } else if (breaches.some((b) => b.severity === "Warning")) {
    status = "Warning";
  }

  return { healthScore, status, breaches };
};
