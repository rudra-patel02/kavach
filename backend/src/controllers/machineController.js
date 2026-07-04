import mongoose from "mongoose";

import Machine from "../models/machine.js";

const getMachineLookup = (id) => {
  const identifier = String(id || "").trim();
  const filters = [{ machineId: identifier }];

  if (mongoose.isValidObjectId(identifier)) {
    filters.push({ _id: identifier });
  }

  return {
    identifier,
    query: { $or: filters },
  };
};

export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    res.status(200).json(machines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch machines" });
  }
};

export const getMachine = async (req, res) => {
  try {
    const { identifier, query } = getMachineLookup(req.params.id);

    if (!identifier) {
      return res.status(400).json({ message: "Machine id is required" });
    }

    const machine = await Machine.findOne(query).lean();

    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    res.json(machine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
