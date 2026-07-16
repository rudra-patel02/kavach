"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { time: "10:00", temp: 61 },
  { time: "10:05", temp: 62 },
  { time: "10:10", temp: 63 },
  { time: "10:15", temp: 62 },
  { time: "10:20", temp: 64 },
  { time: "10:25", temp: 66 },
  { time: "10:30", temp: 65 },
];

export default function LiveSensorChart() {
  return (
    <div className="premium-card chart-frame mt-6 rounded-2xl p-6">

      <h2 className="text-xl font-bold text-white mb-4">
        Temperature Trend
      </h2>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#06b6d4"
            strokeWidth={3}
            isAnimationActive={false}
          />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
