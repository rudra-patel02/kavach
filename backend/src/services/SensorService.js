import Machine from "../models/machine.js";
import predictMachine from "../../ai/prediction.js";

const random = (min, max) => Math.random() * (max - min) + min;

export const startSensorSimulation = (io) => {
  setInterval(async () => {
    try {
      const machines = await Machine.find();

      for (const machine of machines) {
        machine.temperature = Math.max(
          20,
          machine.temperature + random(-2, 2)
        );

        machine.vibration = Math.max(
          0,
          machine.vibration + random(-0.1, 0.1)
        );

        machine.power = Math.max(
          0,
          machine.power + random(-3, 3)
        );

        machine.efficiency = Math.min(
          100,
          Math.max(50, machine.efficiency + random(-1, 1))
        );

        machine.health = Math.min(
          100,
          Math.max(0, machine.health + random(-0.5, 0.3))
        );

        if (machine.health > 80) {
          machine.status = "Running";
        } else if (machine.health > 50) {
          machine.status = "Warning";
        } else {
          machine.status = "Critical";
        }

        machine.lastHeartbeat = new Date();
        machine.aiPrediction = predictMachine(machine.toObject());

        await machine.save();
      }

      const updatedMachines = await Machine.find();

      io.emit("machineUpdate", updatedMachines);
    } catch (err) {
      console.error(err);
    }
  }, 1000);
};