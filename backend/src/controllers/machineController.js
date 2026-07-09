import Machine from "../models/machine.js";
import Reading from "../models/reading.js";

const serialize = (machine) => ({ ...machine, id: String(machine._id || machine.id) });

// GET /api/machines — the plant's machines with their derived health/status and
// thresholds. Read-only; feeds the dashboard health list and machine pickers.
export const listMachines = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    res.json({ success: true, machines: machines.map(serialize) });
  } catch (error) {
    console.error("Failed to list machines:", error.message);
    res.status(500).json({ success: false, message: "Failed to list machines" });
  }
};

// GET /api/machines/:id — one machine (by its business machineId) plus its
// recent readings, for the drill-down / detail view. Only real, stored readings
// are returned (each carries its source label — device vs sim).
export const getMachine = async (req, res) => {
  try {
    const machineId = String(req.params.id);
    const machine = await Machine.findOne({ machineId }).lean();
    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }
    const readings = await Reading.find({ machineId }).sort({ ts: -1 }).limit(200).lean();
    res.json({ success: true, machine: serialize(machine), readings });
  } catch (error) {
    console.error("Failed to load machine:", error.message);
    res.status(500).json({ success: false, message: "Failed to load machine" });
  }
};
