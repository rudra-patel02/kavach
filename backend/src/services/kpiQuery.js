import Alert from "../models/alert.js";
import Machine from "../models/machine.js";
import Reading from "../models/reading.js";
import WorkOrder from "../models/workOrder.js";
import { computeMachineKPIs, computePlantKPIs } from "./kpi.js";

const HOUR_MS = 3_600_000;
const DEFAULT_WINDOW_HOURS = 24;
const MAX_WINDOW_HOURS = 24 * 90; // 90 days

// Resolve [from, to] from a query, defaulting to the last 24h. Invalid or
// out-of-range values fall back to the default window rather than erroring.
export const resolveWindow = (query = {}) => {
  const now = Date.now();
  let to = query.to ? new Date(query.to).getTime() : now;
  if (!Number.isFinite(to)) {
    to = now;
  }

  let from = query.from ? new Date(query.from).getTime() : null;
  if (!Number.isFinite(from) || from === null) {
    const hours = Number(query.windowHours);
    const windowHours =
      Number.isFinite(hours) && hours > 0 ? Math.min(hours, MAX_WINDOW_HOURS) : DEFAULT_WINDOW_HOURS;
    from = to - windowHours * HOUR_MS;
  }

  if (from > to) {
    from = to - DEFAULT_WINDOW_HOURS * HOUR_MS;
  }

  return { from, to };
};

// The single source of truth for plant + per-machine KPIs over a window. Both
// GET /api/kpis and the report export call this, so the dashboard and the
// report can never disagree. Single-plant v1: every authed caller sees the one
// plant; multi-tenant scoping is deferred.
export const computeKpis = async (query = {}) => {
  const { from, to } = resolveWindow(query);
  const windowStart = new Date(from);
  const windowEnd = new Date(to);

  const machineFilter = query.machineId ? { machineId: String(query.machineId) } : {};

  const [machines, readings, alerts, workOrders] = await Promise.all([
    Machine.find(machineFilter).lean(),
    Reading.find({ ts: { $gte: windowStart, $lte: windowEnd } }).lean(),
    // Alerts that started in the window OR are still active (span into it).
    Alert.find({
      $or: [
        { ts: { $gte: windowStart, $lte: windowEnd } },
        { status: { $in: ["open", "acknowledged"] } },
      ],
    }).lean(),
    // Work orders resolved in the window — their createdAt→resolvedAt repair
    // intervals feed the KPI engine's MTTR (Part 4 closes the loop into Part 3).
    WorkOrder.find({
      status: "Resolved",
      resolvedAt: { $gte: windowStart, $lte: windowEnd },
    }).lean(),
  ]);

  const datasets = { readings, alerts, workOrders, windowStart: from, windowEnd: to };
  const plant = computePlantKPIs(machines, datasets);
  const perMachine = machines.map((machine) => computeMachineKPIs(machine, datasets));

  return {
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
    plant,
    machines: perMachine,
  };
};
