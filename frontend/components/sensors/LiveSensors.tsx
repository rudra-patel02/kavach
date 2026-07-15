"use client";

import { useEffect, useState } from "react";
import { Droplets, Thermometer } from "lucide-react";
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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            ESP32 DHT22
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Live Sensor Data
          </h2>
        </div>

        <div className="rounded-full border border-cyan-400/30 px-3 py-1 text-sm text-cyan-200">
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
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm text-slate-400">Temperature</h3>
            <Thermometer size={22} className="text-orange-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-orange-400">
            {reading?.temperature ?? "--"} C
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm text-slate-400">Humidity</h3>
            <Droplets size={22} className="text-cyan-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-cyan-400">
            {reading?.humidity ?? "--"}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
        <span>Device: {reading?.deviceId || ESP32_DEVICE_ID}</span>
        <span>Status: {reading?.connectionStatus || "Waiting"}</span>
        <span>Updated: {updatedAt}</span>
      </div>
    </div>
  );
}
