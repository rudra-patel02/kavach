// Pure, deterministic KPI engine (OEE / MTBF / MTTR). No I/O and no clock — the
// orchestrators take an explicit [windowStart, windowEnd] and the raw
// readings/alerts, so the same inputs always yield the same numbers. This is
// where the audit's "wrong OEE/MTBF math" (subtracting hours from percentages,
// mixing units) is fixed: every ratio here is time/time or count/count, and the
// three OEE factors are proper fractions in [0, 1].

const HOUR_MS = 3_600_000;

export const clampFraction = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

const msToHours = (ms) => (Number.isFinite(ms) ? ms / HOUR_MS : 0);

// --- the three OEE factors (each a proper fraction) -----------------------
export const computeAvailability = ({ plannedMs, downtimeMs }) => {
  if (!plannedMs || plannedMs <= 0) {
    return 0;
  }
  const uptime = plannedMs - Math.max(0, downtimeMs || 0);
  return clampFraction(uptime / plannedMs);
};

export const computePerformance = ({ producedUnits, ratedThroughput, runTimeMs }) => {
  const idealUnits = (ratedThroughput || 0) * msToHours(runTimeMs);
  if (!idealUnits || idealUnits <= 0) {
    return 0;
  }
  return clampFraction((producedUnits || 0) / idealUnits);
};

export const computeQuality = ({ goodUnits, totalUnits }) => {
  if (!totalUnits || totalUnits <= 0) {
    return 0;
  }
  return clampFraction((goodUnits || 0) / totalUnits);
};

export const computeOEE = (availability, performance, quality) =>
  clampFraction(availability) * clampFraction(performance) * clampFraction(quality);

// --- reliability metrics (real elapsed / repair time) ---------------------
export const computeMTBF = ({ operatingMs, failures }) => {
  if (!failures || failures <= 0) {
    return 0; // no failures observed in the window → 0, never NaN/Infinity
  }
  return msToHours(operatingMs) / failures;
};

// Averages actual repair durations. Each interval is { startMs, endMs }; the
// source (resolved alerts now, work orders in Part 4) is irrelevant to the math.
export const computeMTTR = (repairIntervals = []) => {
  const durations = repairIntervals
    .map(({ startMs, endMs }) => endMs - startMs)
    .filter((d) => Number.isFinite(d) && d >= 0);

  if (durations.length === 0) {
    return 0;
  }

  const total = durations.reduce((sum, d) => sum + d, 0);
  return msToHours(total / durations.length);
};

// --- window / interval helpers --------------------------------------------
const toMs = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

const withinWindow = (ts, start, end) => {
  const t = toMs(ts);
  return Number.isFinite(t) && t >= start && t <= end;
};

// Merge overlapping intervals and sum their total covered duration (so two
// concurrent breaches don't double-count downtime).
const unionDurationMs = (intervals) => {
  const valid = intervals
    .filter((i) => Number.isFinite(i.startMs) && Number.isFinite(i.endMs) && i.endMs > i.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  let total = 0;
  let curStart = null;
  let curEnd = null;

  for (const { startMs, endMs } of valid) {
    if (curEnd === null || startMs > curEnd) {
      // disjoint from the current run → bank the run and start a new one
      if (curEnd !== null) {
        total += curEnd - curStart;
      }
      curStart = startMs;
      curEnd = endMs;
    } else {
      // overlaps/adjacent → extend the current run
      curEnd = Math.max(curEnd, endMs);
    }
  }

  if (curEnd !== null) {
    total += curEnd - curStart;
  }

  return total;
};

const LIVE_SOURCE = "device";

const sumMetric = (readings, metric, { windowStart, windowEnd }) =>
  readings
    .filter(
      (r) =>
        r.metric === metric &&
        (r.source === undefined || r.source === LIVE_SOURCE) &&
        withinWindow(r.ts, windowStart, windowEnd)
    )
    .reduce((sum, r) => sum + (Number(r.value) || 0), 0);

// Critical alerts whose onset falls in the window. A machine that is Critical by
// status is represented by its open Critical alert, so counting alerts here
// yields exactly one failure per event (no status/alert double-count).
const criticalAlertsInWindow = (alerts, windowStart, windowEnd) =>
  alerts.filter((a) => a.severity === "Critical" && withinWindow(a.ts, windowStart, windowEnd));

// --- per-machine + plant orchestrators ------------------------------------
export const computeMachineKPIs = (
  machine = {},
  { readings = [], alerts = [], workOrders = [], windowStart, windowEnd } = {}
) => {
  const start = toMs(windowStart);
  const end = toMs(windowEnd);
  const plannedMs = Math.max(0, end - start);

  const machineAlerts = alerts.filter((a) => a.machineId === machine.machineId);
  const failureAlerts = criticalAlertsInWindow(machineAlerts, start, end);

  // Downtime = union of Critical breach intervals, clamped to the window.
  const downtimeIntervals = failureAlerts.map((a) => ({
    startMs: Math.max(start, toMs(a.ts)),
    endMs: Math.min(end, a.resolvedAt ? toMs(a.resolvedAt) : end),
  }));
  const downtimeMs = unionDurationMs(downtimeIntervals);
  const runTimeMs = Math.max(0, plannedMs - downtimeMs);

  const machineReadings = readings.filter((r) => r.machineId === machine.machineId);
  const producedUnits = sumMetric(machineReadings, "unitsTotal", {
    windowStart: start,
    windowEnd: end,
  });
  const goodUnits = sumMetric(machineReadings, "unitsGood", {
    windowStart: start,
    windowEnd: end,
  });

  const availability = computeAvailability({ plannedMs, downtimeMs });

  const hasPerformance = (machine.ratedThroughput || 0) > 0 && runTimeMs > 0;
  const performance = hasPerformance
    ? computePerformance({ producedUnits, ratedThroughput: machine.ratedThroughput, runTimeMs })
    : null;

  const hasQuality = producedUnits > 0;
  const quality = hasQuality ? computeQuality({ goodUnits, totalUnits: producedUnits }) : null;

  const dataComplete = performance !== null && quality !== null;
  const oee = dataComplete ? computeOEE(availability, performance, quality) : null;

  const failures = failureAlerts.length;
  const mtbfHours = computeMTBF({ operatingMs: runTimeMs, failures });

  // MTTR: prefer work-order repair intervals (Part 4) when supplied, else the
  // recovery time of resolved Critical alerts within the window.
  const machineWorkOrders = workOrders.filter(
    (w) => w.machineId === machine.machineId && w.resolvedAt && w.createdAt
  );
  const repairIntervals =
    machineWorkOrders.length > 0
      ? machineWorkOrders.map((w) => ({ startMs: toMs(w.createdAt), endMs: toMs(w.resolvedAt) }))
      : failureAlerts
          .filter((a) => a.resolvedAt)
          .map((a) => ({ startMs: toMs(a.ts), endMs: toMs(a.resolvedAt) }));
  const mttrHours = computeMTTR(repairIntervals);

  return {
    machineId: machine.machineId,
    name: machine.name,
    status: machine.status,
    availability,
    performance,
    quality,
    oee,
    dataComplete,
    mtbfHours,
    mttrHours,
    failures,
    producedUnits,
    goodUnits,
    downtimeMs,
    runTimeMs,
  };
};

const mean = (values) => {
  const nums = values.filter((v) => Number.isFinite(v));
  return nums.length === 0 ? 0 : nums.reduce((s, v) => s + v, 0) / nums.length;
};

export const computePlantKPIs = (machines = [], datasets = {}) => {
  const perMachine = machines.map((machine) => computeMachineKPIs(machine, datasets));

  const complete = perMachine.filter((m) => m.dataComplete);
  const totalOperatingMs = perMachine.reduce((s, m) => s + m.runTimeMs, 0);
  const totalFailures = perMachine.reduce((s, m) => s + m.failures, 0);

  return {
    machineCount: machines.length,
    availability: mean(perMachine.map((m) => m.availability)),
    performance: complete.length ? mean(complete.map((m) => m.performance)) : null,
    quality: complete.length ? mean(complete.map((m) => m.quality)) : null,
    oee: complete.length ? mean(complete.map((m) => m.oee)) : null,
    dataComplete: perMachine.length > 0 && complete.length === perMachine.length,
    mtbfHours: computeMTBF({ operatingMs: totalOperatingMs, failures: totalFailures }),
    mttrHours: mean(perMachine.filter((m) => m.mttrHours > 0).map((m) => m.mttrHours)),
    failures: totalFailures,
  };
};
