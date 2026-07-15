"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, RadioTower, Thermometer } from "lucide-react";
import { fetchLatestIoTSensor } from "@/lib/iot";
import socket, { SOCKET_EVENTS } from "@/lib/socket";
import type { MachineData } from "@/types/machine";
import type { IoTSensorReading } from "@/types/iot";

const ESP32_DEVICE_ID = "esp32-dht22-01";

export default function LiveSensors() {
  const [reading, setReading] = useState<IoTSensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReading = async () => {
      try {
        const response = await fetchLatestIoTSensor(ESP32_DEVICE_ID);

        if (!isMounted) {
          return;
        }

        setReading(response.reading);
        setError(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load sensor data"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReading();
    const timer = window.setInterval(loadReading, 5000);
    const handleSensorUpdate = (machine: MachineData) => {
      if (machine?.linkedDeviceId !== ESP32_DEVICE_ID) {
        return;
      }

      setReading({
        deviceId: machine.linkedDeviceId,
        humidity: machine.humidity ?? null,
        id: machine._id,
        machineId: machine.machineId,
        temperature: machine.temperature ?? null,
        timestamp:
          machine.lastLiveTelemetryAt ||
          machine.lastHeartbeat ||
          new Date().toISOString(),
        connectionStatus: "online",
        lastSeen: machine.lastLiveTelemetryAt || machine.lastHeartbeat || null,
      });
      setError(null);
      setIsLoading(false);
    };

    socket.on(SOCKET_EVENTS.SENSOR_UPDATE, handleSensorUpdate);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      socket.off(SOCKET_EVENTS.SENSOR_UPDATE, handleSensorUpdate);
    };
  }, []);

  const updatedAt = reading?.timestamp
    ? new Date(reading.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Waiting";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="premium-card rounded-2xl p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            ESP32 DHT22
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Live Sensor Data
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
          <span className="live-dot h-2 w-2 rounded-full bg-cyan-300" />
          {isLoading
            ? "Connecting"
            : reading?.connectionStatus || (reading ? "online" : "No reading")}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="premium-tile rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm text-slate-400">Temperature</h3>
            <div className="rounded-lg bg-orange-400/10 p-2">
              <Thermometer size={22} className="text-orange-300" />
            </div>
          </div>
          <p className="mt-3 text-4xl font-black text-orange-300">
            {reading?.temperature ?? "--"} C
          </p>
        </div>

        <div className="premium-tile rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm text-slate-400">Humidity</h3>
            <div className="rounded-lg bg-cyan-400/10 p-2">
              <Droplets size={22} className="text-cyan-300" />
            </div>
          </div>
          <p className="mt-3 text-4xl font-black text-cyan-300">
            {reading?.humidity ?? "--"}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
        <span className="inline-flex items-center gap-2">
          <RadioTower size={15} className="text-cyan-300" />
          Device: {reading?.deviceId || ESP32_DEVICE_ID}
        </span>
        <span>Status: {reading?.connectionStatus || "Waiting"}</span>
        <span>Updated: {updatedAt}</span>
      </div>
    </motion.div>
  );
}
