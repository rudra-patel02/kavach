"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "8 AM", production: 90 },
  { time: "10 AM", production: 120 },
  { time: "12 PM", production: 160 },
  { time: "2 PM", production: 185 },
  { time: "4 PM", production: 220 },
  { time: "6 PM", production: 250 },
];

export default function AnalyticsCharts() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Production Analytics
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="production"
              stroke="#00E5FF"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}