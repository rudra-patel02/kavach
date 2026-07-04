"use client";

import {
CircularProgressbar,
buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MachineDetails() {
  const{ id } = useParams();
  
  const [machine, setMachine] = useState<any>(null);
  const [liveHealth, setLiveHealth] = useState(98);
  const [liveTemperature, setLiveTemperature] = useState(62);

 useEffect(() => {
  if (!id) return;

  fetch("http://localhost:5000/api/machines")
    .then((res) => res.json())
    .then((data) => {
      const found = data.find((m: any) => m.machineId === id);

      if (found) {
        setMachine(found);
      } else {
        console.error("Machine not found");
      }
    })
    .catch((err) => console.error(err));
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

  if (!machine) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
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
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <h1 className="text-4xl font-bold mb-8">
        {machine.name}
      </h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div className="bg-slate-900 rounded-xl p-6 flex flex-col items-center">
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
        <div className="bg-slate-900 rounded-xl p-6">
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

        <div className="bg-slate-900 rounded-xl p-6">
          <p className="text-slate-400">Health</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            {liveHealth}%
          </h2>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 flex flex-col items-center">
  <p className="text-slate-400 mb-4">Temperature</p>

  <div className="w-28 h-28">
    <CircularProgressbar
      value={liveTemperature}
      maxValue={120}
      text={`${liveTemperature}°`}
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

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-slate-900 rounded-xl p-6">

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
                stroke="#06b6d4"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="bg-slate-900 rounded-xl p-6">

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
  );
}