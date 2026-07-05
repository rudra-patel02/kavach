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

// Get all machines
export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 }).lean();
    res.status(200).json(machines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch machines" });
  }
};

// Get machine by ID
export const getMachineById = async (req, res) => {
  try {
    const { identifier, query } = getMachineLookup(req.params.id);

    if (!identifier) {
      return res.status(400).json({
        message: "Machine ID is required",
      });
    }

    const machine = await Machine.findOne(query).lean();

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    res.status(200).json(machine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Create machine
export const createMachine = async (req, res) => {
  try {
    const machine = await Machine.create({
      machineId: req.body.machineId,
      name: req.body.name,
      department: req.body.department,
      status: req.body.status,

      health: 100,
      temperature: 25,
      vibration: 0.2,
      pressure: 1.0,
      power: 0,
      current: 0,
      voltage: 415,
      energyConsumed: 0,
      efficiency: 100,
      rpm: 1450,
      humidity: 45,
      downtime: 0,
      oee: 100,
      remainingUsefulLifeHours: 720,
      predictedFailureProbability: 2,

      aiPrediction: {
        failureRisk: "Low",
        maintenancePriority: "Low",
        maintenanceInDays: 30,
        recommendation: "Machine operating normally.",
      },
    });

    res.status(201).json(machine);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to create machine",
    });
  }
};

// Update machine
export const updateMachine = async (req, res) => {
  try {
    const { query } = getMachineLookup(req.params.id);

    const machine = await Machine.findOneAndUpdate(
      query,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    res.json(machine);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to update machine",
    });
  }
};

// Delete machine
export const deleteMachine = async (req, res) => {
  try {
    const { query } = getMachineLookup(req.params.id);

    const machine = await Machine.findOneAndDelete(query);

    if (!machine) {
      return res.status(404).json({
        message: "Machine not found",
      });
    }

    res.json({
      success: true,
      message: "Machine deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to delete machine",
    });
  }
};
