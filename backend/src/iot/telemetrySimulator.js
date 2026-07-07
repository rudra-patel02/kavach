import Machine from "../models/machine.js";
import { ingestTelemetry, isSimulationEnabled } from "../services/ingest.js";

export const isSimulatorEnabled = () => isSimulationEnabled();

const jitter = (base, spread) => Number((base + (Math.random() - 0.5) * spread).toFixed(2));

// Produce a single simulated telemetry packet for a machine. Every packet is
// flagged `source: "sim"` so it can never be confused with real device data.
export const generateSimReading = (machine = {}) => ({
  machineId: machine.machineId,
  deviceId: machine.linkedDeviceId || `sim-${machine.machineId || "unknown"}`,
  timestamp: new Date().toISOString(),
  source: "sim",
  temperature: jitter(62, 8),
  vibration: jitter(0.3, 0.2),
  oilLevel: jitter(80, 10),
  rpm: jitter(1450, 60),
});

// Dev-only loop. Does nothing unless the simulator is explicitly enabled via
// ENABLE_SENSOR_SIMULATION, so it can never quietly feed a production plant.
// Returns a stop() function.
export const startSimulator = ({ intervalMs = 2000 } = {}) => {
  if (!isSimulatorEnabled()) {
    return () => {};
  }

  console.warn(
    "[simulator] ENABLE_SENSOR_SIMULATION is on — emitting SIMULATED telemetry (source=sim)"
  );

  const tick = async () => {
    try {
      const machines = await Machine.find().lean();
      for (const machine of machines) {
        await ingestTelemetry(generateSimReading(machine), {
          source: "sim",
          trusted: true,
        });
      }
    } catch (error) {
      console.error("[simulator] tick failed:", error.message);
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => clearInterval(timer);
};
