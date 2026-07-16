"use client";

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchMachine } from "@/lib/machines";
import type { MachineData } from "@/types/machine";

export default function MachineDetails() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  const [machine, setMachine] = useState<MachineData | null>(null);
  const [liveHealth, setLiveHealth] = useState(98);
  const [liveTemperature, setLiveTemperature] = useState(62);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchMachine(id)
      .then((response) => {
        setMachine(response);
        setLiveHealth(Number(response.health ?? 98));
        setLiveTemperature(Number(response.temperature ?? 62));
        setError(null);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load machine details"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
  const interval = setInterval(() => {
    setLiveHealth((prev) => {
      let value = prev + Math.floor(Math.random() * 5) - 2;

      if (value > 100) value = 100;
      if (value < 30) value = 30;

      return value;
    });

    setLiveTemperature((prev) => {
      let value = prev + Math.floor(Math.random() * 5) - 2;

      if (value > 110) value = 110;
      if (value < 40) value = 40;

      return value;
    });
  }, 2000);

  return () => clearInterval(interval);
}, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-cyan-200">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Loader2 size={20} className="animate-spin" />
            Loading machine details
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !machine) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} />
            <h1 className="text-xl font-bold">Machine unavailable</h1>
          </div>
          <p className="mt-2 text-sm">{error || "Machine was not found."}</p>
        </div>
      </DashboardLayout>
    );
  }

  const sensorData = [
    { time: "10:00", value: liveTemperature - 5 },
    { time: "10:30", value: liveTemperature - 3 },
    { time: "11:00", value: liveTemperature - 1 },
    { time: "11:30", value: liveTemperature + 1 },
    { time: "12:00", value: liveTemperature },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">

      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Machine Detail
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          {machine.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {machine.machineId} - {machine.department}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col items-center">
  <p className="text-slate-400 mb-4">Health</p>

  <div className="w-28 h-28">
    <CircularProgressbar
      value={liveHealth}
      text={`${liveHealth}%`}
      styles={buildStyles({
        textColor: "#22d3ee",
        pathColor:
          liveHealth > 80
            ? "#22c55e"
            : liveHealth > 60
            ? "#facc15"
            : "#ef4444",
        trailColor: "#1e293b",
      })}
    />
  </div>
</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-slate-400">Status</p>

          <h2
            className={`text-2xl font-bold ${
              machine.status === "Running"
                ? "text-green-400"
                : machine.status === "Warning"
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {machine.status}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-slate-400">Health</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            {liveHealth}%
          </h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col items-center">
  <p className="text-slate-400 mb-4">Temperature</p>

  <div className="w-28 h-28">
    <CircularProgressbar
      value={liveTemperature}
      maxValue={120}
      text={`${liveTemperature} C`}
      styles={buildStyles({
        textColor: "#fb923c",
        pathColor:
          liveTemperature < 70
            ? "#22c55e"
            : liveTemperature < 90
            ? "#facc15"
            : "#ef4444",
        trailColor: "#1e293b",
      })}
    />
  </div>
</div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Live Temperature
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sensorData}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                isAnimationActive={false}
                stroke="#06b6d4"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="text-2xl font-semibold mb-4">
            AI Analysis
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-slate-400">Prediction</p>

              <h2 className="text-3xl font-bold text-green-400">
                Healthy
              </h2>
            </div>

            <div>
              <p className="text-slate-400">
                Estimated Failure Risk
              </p>

              <div className="w-full bg-slate-700 rounded-full h-4 mt-2">

                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${100 - liveHealth}%` }}
                />

              </div>

              <p className="mt-2">
                {100 - liveHealth}% Risk
              </p>

            </div>

            <div>
              <p className="text-slate-400">
                Recommendation
              </p>

              <p className="mt-2 text-slate-200">
                Continue monitoring machine. Schedule preventive maintenance if health drops below 70%.
              </p>
            </div>

          </div>

        </div>

      </div>

      </div>
    </DashboardLayout>
  );
}
