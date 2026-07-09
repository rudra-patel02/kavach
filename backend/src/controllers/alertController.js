import mongoose from "mongoose";

import Alert from "../models/alert.js";
import { acknowledgeAlert } from "../services/alerts.js";

const serialize = (alert) => ({ ...alert, id: String(alert._id || alert.id) });

// GET /api/alerts — chronological threshold breaches. Defaults to the active
// ones (open + acknowledged); ?status=/&machineId= narrow further.
export const listAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = String(req.query.status);
    } else {
      filter.status = { $in: ["open", "acknowledged"] };
    }
    if (req.query.machineId) {
      filter.machineId = String(req.query.machineId);
    }
    const alerts = await Alert.find(filter).sort({ ts: -1 }).limit(200).lean();
    res.json({ success: true, alerts: alerts.map(serialize) });
  } catch (error) {
    console.error("Failed to list alerts:", error.message);
    res.status(500).json({ success: false, message: "Failed to list alerts" });
  }
};

// PATCH /api/alerts/:id/acknowledge — a Manager acknowledges an active alert
// (records who/when). A resolved alert cannot be acknowledged (409).
export const acknowledge = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    const alert = await acknowledgeAlert(req.params.id, req.user.id);
    res.json({ success: true, alert: serialize(alert.toObject()) });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to acknowledge alert",
    });
  }
};
