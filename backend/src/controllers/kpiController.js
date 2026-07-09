import { computeKpis } from "../services/kpiQuery.js";

// GET /api/kpis — plant + per-machine OEE/MTBF/MTTR over a window. Auth-required
// (mounted behind authMiddleware + dashboard:read). Delegates to the shared
// computeKpis so the dashboard and the report export can never disagree.
export const getKpis = async (req, res) => {
  try {
    const { window, plant, machines } = await computeKpis(req.query);
    res.json({ success: true, window, plant, machines });
  } catch (error) {
    console.error("KPI computation failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to compute KPIs" });
  }
};
