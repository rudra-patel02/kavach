import Alert from "../models/alert.js";
import Machine from "../models/machine.js";
import Reading from "../models/reading.js";
import { computeMachineKPIs, computePlantKPIs } from "../services/kpi.js";

const DEFAULT_WINDOW_HOURS = 24;
const MAX_WINDOW_HOURS = 24 * 90; // 90 days

// Resolve [from, to] from the query, defaulting to the last 24h. Invalid or
// out-of-range values fall back to the default window rather than erroring.
const resolveWindow = (query = {}) => {
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
    from = to - windowHours * 3_600_000;
  }

  if (from > to) {
    from = to - DEFAULT_WINDOW_HOURS * 3_600_000;
  }

  return { from, to };
};

// GET /api/kpis — plant + per-machine OEE/MTBF/MTTR over a window. Auth-required
// (mounted behind authMiddleware + dashboard:read). Single-plant v1: every
// authenticated caller sees the one plant; multi-tenant scoping is deferred.
export const getKpis = async (req, res) => {
  try {
    const { from, to } = resolveWindow(req.query);
    const windowStart = new Date(from);
    const windowEnd = new Date(to);

    const machineFilter = req.query.machineId ? { machineId: String(req.query.machineId) } : {};

    const [machines, readings, alerts] = await Promise.all([
      Machine.find(machineFilter).lean(),
      Reading.find({ ts: { $gte: windowStart, $lte: windowEnd } }).lean(),
      // Alerts that started in the window OR are still active (span into it).
      Alert.find({
        $or: [
          { ts: { $gte: windowStart, $lte: windowEnd } },
          { status: { $in: ["open", "acknowledged"] } },
        ],
      }).lean(),
    ]);

    const datasets = { readings, alerts, windowStart: from, windowEnd: to };
    const plant = computePlantKPIs(machines, datasets);
    const perMachine = machines.map((machine) => computeMachineKPIs(machine, datasets));

    res.json({
      success: true,
      window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
      plant,
      machines: perMachine,
    });
  } catch (error) {
    console.error("KPI computation failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to compute KPIs" });
  }
};
