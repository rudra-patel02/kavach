import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import WorkOrder from "../models/workOrder.js";
import { buildGlobalSearchResults } from "../services/searchService.js";

export const globalSearch = async (req, res) => {
  try {
    const query = String(req.query.q || req.query.query || "").trim();

    if (query.length < 2) {
      return res.json({
        success: true,
        query,
        results: [],
      });
    }

    const [machines, notifications, workOrders, users] = await Promise.all([
      Machine.find().sort({ machineId: 1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).limit(250).lean(),
      WorkOrder.find().sort({ createdAt: -1 }).limit(250).lean(),
      User.find().select("-password -refreshToken").sort({ name: 1 }).lean(),
    ]);

    const results = buildGlobalSearchResults({
      query,
      machines,
      notifications,
      workOrders,
      users,
    });

    res.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("Global search failed:", error);
    res.status(500).json({
      message: "Failed to run global search",
    });
  }
};
